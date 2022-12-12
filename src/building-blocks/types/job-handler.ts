import { Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import { LogEvent, LogEventKey } from './log.event'
import { SuiviJob, SuiviJobs } from '../../domain/suivi-jobs'
import { Planificateur } from '../../domain/planificateur'
import JobType = Planificateur.JobType

/**
 * Implémente la logique nécessaire à la réalisation du job envoyée au système.
 */
export abstract class JobHandler<C> {
  protected logger: Logger
  protected apmService: APM.Agent
  protected jobType: JobType
  private suiviJobsService: SuiviJobs.Service

  constructor(jobType: JobType, suiviJobsService: SuiviJobs.Service) {
    this.jobType = jobType
    this.logger = new Logger(jobType)
    this.suiviJobsService = suiviJobsService
    this.apmService = getAPMInstance()
  }

  async execute(): Promise<SuiviJob> {
    try {
      const result = await this.handle()
      await this.suiviJobsService.save(result)
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
