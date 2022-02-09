import { Inject, Injectable, Logger } from '@nestjs/common'
import * as apm from 'elastic-apm-node'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'
import { HandleJobMailConseillerCommandHandler } from './commands/jobs/handle-job-mail-conseiller.command'
import { HandleJobRendezVousCommandHandler } from './commands/jobs/handle-job-rendez-vous.command'
import { NotifierNouvellesOffresEmploiCommandHandler } from './commands/jobs/handle-job-notification-recherche.command'

@Injectable()
export class WorkerService {
  private apmService: apm.Agent
  private readonly logger: Logger = new Logger('WorkerService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private handlerJobRendezVousCommandHandler: HandleJobRendezVousCommandHandler,
    private handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler,
    private notifierNouvellesOffresEmploiCommandHandler: NotifierNouvellesOffresEmploiCommandHandler
  ) {
    this.apmService = getAPMInstance()
  }

  subscribe(): void {
    this.planificateurRepository.subscribe(this.handler.bind(this))
  }

  async handler(job: Planificateur.Job<unknown>): Promise<void> {
    const transaction = this.apmService.startTransaction(
      `JOB-${job.type}`,
      'worker'
    )
    const startTime = new Date().getMilliseconds()
    let success = true
    this.logger.log({
      job,
      state: 'started'
    })
    try {
      if (job.type === Planificateur.JobEnum.RENDEZVOUS) {
        await this.handlerJobRendezVousCommandHandler.execute({
          job: job as Planificateur.Job<Planificateur.JobRendezVous>
        })
      } else if (job.type === Planificateur.JobEnum.MAIL_CONSEILLER) {
        await this.handleJobMailConseillerCommandHandler.execute({
          job: job as Planificateur.Job<Planificateur.JobMailConseiller>
        })
      } else if (job.type === Planificateur.CronJob.NOUVELLES_OFFRES_EMPLOI) {
        await this.notifierNouvellesOffresEmploiCommandHandler.execute({})
      } else if (job.type === Planificateur.JobEnum.FAKE) {
        this.logger.log({
          job,
          msg: 'executed'
        })
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
    }
  }
}
