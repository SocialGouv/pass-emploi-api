import { Inject, Injectable, Logger } from '@nestjs/common'
import * as apm from 'elastic-apm-node'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'
import { HandleJobMailConseillerCommandHandler } from './commands/jobs/handle-job-mail-conseiller.command'
import { HandleJobRendezVousCommandHandler } from './commands/jobs/handle-job-rendez-vous.command'
import { HandleNettoyerLesJobsCommandHandler } from './commands/jobs/handle-job-nettoyer-les-jobs.command'
import { HandleJobUpdateMailingListConseillerCommandHandler } from './commands/jobs/handle-job-update-mailing-list-conseiller.command'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from './commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from './commands/jobs/handle-job-notification-recherche-service-civique.command.handler'

@Injectable()
export class WorkerService {
  private apmService: apm.Agent
  private readonly logger: Logger = new Logger('WorkerService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private handlerJobRendezVousCommandHandler: HandleJobRendezVousCommandHandler,
    private handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler,
    private notifierNouvellesOffresEmploiCommandHandler: HandleJobNotifierNouvellesOffresEmploiCommandHandler,
    private handleNettoyerLesJobsCommandHandler: HandleNettoyerLesJobsCommandHandler,
    private handleJobUpdateMailingListConseillerCommandHandler: HandleJobUpdateMailingListConseillerCommandHandler,
    private handleJobNotifierNouveauxServicesCiviqueCommandHandler: HandleJobNotifierNouveauxServicesCiviqueCommandHandler
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
      switch (job.type) {
        case Planificateur.JobEnum.RENDEZVOUS:
          await this.handlerJobRendezVousCommandHandler.execute({
            job: job as Planificateur.Job<Planificateur.JobRendezVous>
          })
          break
        case Planificateur.CronJob.MAIL_CONSEILLER_MESSAGES:
          await this.handleJobMailConseillerCommandHandler.execute({})
          break
        case Planificateur.CronJob.NOUVELLES_OFFRES_EMPLOI:
          await this.notifierNouvellesOffresEmploiCommandHandler.execute({})
          break
        case Planificateur.CronJob.NOUVELLES_OFFRES_SERVICE_CIVIQUE:
          await this.handleJobNotifierNouveauxServicesCiviqueCommandHandler.execute(
            {}
          )
          break
        case Planificateur.CronJob.NETTOYER_LES_JOBS:
          await this.handleNettoyerLesJobsCommandHandler.execute({})
          break
        case Planificateur.CronJob.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS:
          await this.handleJobUpdateMailingListConseillerCommandHandler.execute(
            {}
          )
          break
        case Planificateur.JobEnum.FAKE:
          this.logger.log({
            job,
            msg: 'executed'
          })
          break
        default:
          this.logger.error(
            `Pas de job handler trouvé pour le type: ${job.type}`
          )
          success = false
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
