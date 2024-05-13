import { Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { Planificateur } from '../../domain/planificateur'
import { estJobSuivi, estNotifiable, SuiviJob } from '../../domain/suivi-job'
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

      if (estJobSuivi(suiviJob.jobType)) {
        this.suiviJobService.save(suiviJob)
      }
      if (estNotifiable(suiviJob)) {
        this.suiviJobService.notifierResultatJob(suiviJob)
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
}
