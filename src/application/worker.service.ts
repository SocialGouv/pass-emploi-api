import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { HandleJobRendezVousCommandHandler } from './commands/handle-job-rendez-vous.command'
import { HandleJobMailConseillerCommandHandler } from './commands/handle-job-mail-conseiller.command'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'
import * as apm from 'elastic-apm-node'

@Injectable()
export class WorkerService {
  private apmService: apm.Agent
  private logger: Logger

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private handlerJobRendezVousCommandHandler: HandleJobRendezVousCommandHandler,
    private handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler
  ) {
    this.apmService = getAPMInstance()
    this.logger = new Logger('WorkerService')
  }

  subscribe(): void {
    this.planificateurRepository.subscribe(this.handler.bind(this))
  }

  async handler(job: Planificateur.Job<unknown>): Promise<void> {
    const transaction = this.apmService.startTransaction(
      `JOB-${job.type}`,
      'worker'
    )
    try {
      if (job.type === Planificateur.JobEnum.RENDEZVOUS) {
        await this.handlerJobRendezVousCommandHandler.execute({
          job: job as Planificateur.Job<Planificateur.JobRendezVous>
        })
      } else if (job.type === Planificateur.JobEnum.MAIL_CONSEILLER) {
        await this.handleJobMailConseillerCommandHandler.execute({
          job: job as Planificateur.Job<Planificateur.JobMailConseiller>
        })
      }
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
