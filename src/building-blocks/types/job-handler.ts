import { Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { Planificateur } from '../../domain/planificateur'
import { SuiviJob } from '../../domain/suivi-job'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import { LogEvent, LogEventKey } from './log.event'
import JobType = Planificateur.JobType

/**
 * Implémente la logique nécessaire à la réalisation du Job envoyé au système.
 */
export abstract class JobHandler<T> {
  protected logger: Logger
  protected apmService: APM.Agent
  protected jobType: JobType
  protected suiviJobService: SuiviJob.Service

  constructor(jobType: JobType, suiviJobService: SuiviJob.Service) {
    this.jobType = jobType
    this.logger = new Logger(jobType)
    this.suiviJobService = suiviJobService
    this.apmService = getAPMInstance()
  }

  async execute(job?: T): Promise<SuiviJob> {
    try {
      const suiviJob = await this.handle(job)

      if (this.estJobSuivi()) {
        await this.suiviJobService.save(suiviJob)
        if (this.estNotifiable(suiviJob)) {
          await this.suiviJobService.notifierResultatJob(suiviJob)
        }
      }

      this.logAfter(suiviJob)
      return suiviJob
    } catch (e) {
      this.apmService.captureError(e)
      this.logAfter(e)
      throw e
    }
  }

  abstract handle(job?: T): Promise<SuiviJob>

  protected logAfter(result: SuiviJob, command?: T): void {
    const event = new LogEvent(LogEventKey.JOB_EVENT, {
      handler: this.jobType,
      command: command,
      result: result
    })
    this.logger.log(event)
  }
  private estJobSuivi(): boolean {
    return ![Planificateur.JobType.MONITORER_JOBS].includes(this.jobType)
  }
  private estNotifiable(suiviJob: SuiviJob): boolean {
    return (
      suiviJob.succes === false ||
      ![
        Planificateur.JobType.MONITORER_JOBS,
        Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO,
        Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE
      ].includes(this.jobType)
    )
  }
}
