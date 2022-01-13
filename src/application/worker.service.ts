import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { HandleJobRendezVousCommandHandler } from './commands/handle-job-rendez-vous.command'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'
import * as apm from 'elastic-apm-node'

@Injectable()
export class WorkerService {
  private apmService: apm.Agent
  private logger: Logger

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private handlerJobRendezVousCommandHandler: HandleJobRendezVousCommandHandler
  ) {
    this.apmService = getAPMInstance()
    this.logger = new Logger('WorkerService')
  }

  subscribe(): void {
    this.planificateurRepository.subscribe(this.handler.bind(this))
  }

  async handler(job: Planificateur.Job): Promise<void> {
    const transaction = this.apmService.startTransaction(
      `JOB-${job.type}`,
      'worker'
    )
    try {
      await this.handlerJobRendezVousCommandHandler.execute({ job })
      transaction?.end('success')
    } catch (e) {
      if (transaction) {
        transaction.result = 'error'
        transaction.end('failure')
      }
      this.logger.error(e)
    }
  }
}
