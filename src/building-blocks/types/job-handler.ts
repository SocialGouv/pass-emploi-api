import { Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import { LogEvent, LogEventKey } from './log.event'
import { SuiviJob } from '../../domain/suivi-job'
import { Planificateur } from '../../domain/planificateur'
import JobType = Planificateur.JobType

/**
 * Implémente la logique nécessaire à la réalisation du job envoyée au système.
 */
export abstract class JobHandler<C> {
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

  async execute(): Promise<SuiviJob> {
    try {
      const result = await this.handle()
      await this.suiviJobService.save(result)
      if (result.succes === false) {
        await this.suiviJobService.notifierResultatJob(result)
      }
      this.logAfter(result)
      return result
    } catch (e) {
      this.apmService.captureError(e)
      this.logAfter(e)
      throw e
    }
  }

  abstract handle(command?: C): Promise<SuiviJob>

  protected logAfter(result: SuiviJob, command?: C): void {
    const event = new LogEvent(LogEventKey.JOB_EVENT, {
      handler: this.jobType,
      command: command,
      result: result
    })
    this.logger.log(event)
  }
}
