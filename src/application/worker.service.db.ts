import { Inject, Injectable, Logger, Type } from '@nestjs/common'
import * as apm from 'elastic-apm-node'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../domain/planificateur'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'
import {
  getWorkerTrackingServiceInstance,
  WorkerTrackingService
} from '../infrastructure/monitoring/worker.tracking.service'
import { SuiviJob } from '../domain/suivi-job'
import { ModuleRef } from '@nestjs/core'
import { JobHandler } from '../building-blocks/types/job-handler'
import { JobHandlerProviders } from '../app.module'

@Injectable()
export class WorkerService {
  private apmService: apm.Agent
  private workerTrackingService: WorkerTrackingService
  private readonly logger: Logger = new Logger('WorkerService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private planificateurService: PlanificateurService,
    private moduleRef: ModuleRef
  ) {
    this.apmService = getAPMInstance()
    this.workerTrackingService = getWorkerTrackingServiceInstance()
  }

  subscribe(): void {
    this.planificateurRepository.subscribe(this.handler.bind(this))
  }

  async handler(job: Planificateur.Job<unknown>): Promise<void> {
    const jobName = `JOB-${job.type}`
    this.workerTrackingService.startJobTracking(jobName)
    const transaction = this.apmService.startTransaction(jobName, 'worker')
    const startTime = new Date().getMilliseconds()
    let success = true
    this.logger.log({
      job,
      state: 'started'
    })
    let suivi: SuiviJob | undefined
    try {
      const jobHandlerType = getJobHandlerTypeByJobType(job)
      if (!jobHandlerType) {
        this.logger.error(`Pas de job handler trouvé pour le type: ${job.type}`)
        success = false
      } else {
        const jobhandler =
          this.moduleRef.get<JobHandler<unknown>>(jobHandlerType)
        suivi = await jobhandler.execute(job)
      }
    } catch (e) {
      success = false
      this.logger.error(e)
    } finally {
      this.logger.log({
        job,
        state: 'terminated',
        success,
        duration: new Date().getMilliseconds() - startTime
      })
      if (transaction && !success) {
        transaction.result = 'error'
        transaction.end('failure')
      } else if (transaction && success) {
        transaction.end('success')
      }
      if (suivi?.succes === false || !success) {
        // On veut passer le job en fail sur le planificateur
        throw new Error(`${jobName} en échec`)
      }
    }
  }
}

function getJobHandlerTypeByJobType(
  job: Planificateur.Job<unknown>
): Type | undefined {
  return JobHandlerProviders.find(
    jobProvider => job.type === Reflect.getMetadata('jobType', jobProvider)
  )
}
