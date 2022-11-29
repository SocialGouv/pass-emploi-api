import { Inject, Injectable, Logger } from '@nestjs/common'
import * as apm from 'elastic-apm-node'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { getAPMInstance } from '../infrastructure/monitoring/apm.init'
import {
  getWorkerTrackingServiceInstance,
  WorkerTrackingService
} from '../infrastructure/monitoring/worker.tracking.service'
import { HandleJobMailConseillerCommandHandler } from './commands/jobs/handle-job-mail-conseiller.command'
import { HandleNettoyerLesJobsCommandHandler } from './commands/jobs/handle-job-nettoyer-les-jobs.command'
import { HandleJobNettoyerPiecesJointesCommandHandler } from './commands/jobs/handle-job-nettoyer-pieces-jointes.command'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from './commands/jobs/handle-job-notification-recherche-service-civique.command.handler'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from './commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { HandleJobRappelActionCommandHandler } from './commands/jobs/handle-job-rappel-action.command'
import { HandleJobRappelRendezVousCommandHandler } from './commands/jobs/handle-job-rappel-rendez-vous.command'
import { HandleJobRecupererSituationsJeunesMiloCommandHandler } from './commands/jobs/handle-job-recuperer-situations-jeunes-milo.command'
import { HandleJobUpdateMailingListConseillerCommandHandler } from './commands/jobs/handle-job-update-mailing-list-conseiller.command'
import { HandleJobNotifierRendezVousPECommandHandler } from './commands/jobs/handle-job-notifier-rendez-vous-pe.command'
import { HandleJobMettreAJourCodesEvenementsCommandHandler } from './commands/jobs/handle-job-mettre-a-jour-codes-evenements.command'
import { HandleJobNettoyerLesDonneesCommandHandler } from './commands/jobs/handle-job-nettoyer-les-donnees.command.db'
import { HandleJobAgenceAnimationCollectiveCommandHandler } from './commands/jobs/handle-job-agence-animation-collective.command.db'

@Injectable()
export class WorkerService {
  private apmService: apm.Agent
  private workerTrackingService: WorkerTrackingService
  private readonly logger: Logger = new Logger('WorkerService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private handlerJobRendezVousCommandHandler: HandleJobRappelRendezVousCommandHandler,
    private handlerJobRappelActionCommandHandler: HandleJobRappelActionCommandHandler,
    private handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler,
    private handleJobNotifierNouvellesOffresEmploiCommandHandler: HandleJobNotifierNouvellesOffresEmploiCommandHandler,
    private handleNettoyerLesJobsCommandHandler: HandleNettoyerLesJobsCommandHandler,
    private handleJobUpdateMailingListConseillerCommandHandler: HandleJobUpdateMailingListConseillerCommandHandler,
    private handleJobNotifierNouveauxServicesCiviqueCommandHandler: HandleJobNotifierNouveauxServicesCiviqueCommandHandler,
    private handleJobRecupererSituationsJeunesMiloCommandHandler: HandleJobRecupererSituationsJeunesMiloCommandHandler,
    private handleJobNettoyerPiecesJointesCommandHandler: HandleJobNettoyerPiecesJointesCommandHandler,
    private handleJobNettoyerLesDonneesCommandHandler: HandleJobNettoyerLesDonneesCommandHandler,
    private handleJobNotifierRendezVousPECommandHandler: HandleJobNotifierRendezVousPECommandHandler,
    private handleJobMettreAJourCodesEvenementsCommandHandler: HandleJobMettreAJourCodesEvenementsCommandHandler,
    private handleJobAgenceAnimationCollectiveCommand: HandleJobAgenceAnimationCollectiveCommandHandler
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
    try {
      switch (job.type) {
        case Planificateur.JobType.RENDEZVOUS:
          await this.handlerJobRendezVousCommandHandler.execute({
            job: job as Planificateur.Job<Planificateur.JobRendezVous>
          })
          break
        case Planificateur.JobType.RAPPEL_ACTION:
          await this.handlerJobRappelActionCommandHandler.execute({
            job: job as Planificateur.Job<Planificateur.JobRappelAction>
          })
          break
        case Planificateur.JobType.MAIL_CONSEILLER_MESSAGES:
          await this.handleJobMailConseillerCommandHandler.execute()
          break
        case Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI:
          await this.handleJobNotifierNouvellesOffresEmploiCommandHandler.execute()
          break
        case Planificateur.JobType.NOUVELLES_OFFRES_SERVICE_CIVIQUE:
          await this.handleJobNotifierNouveauxServicesCiviqueCommandHandler.execute()
          break
        case Planificateur.JobType.NETTOYER_LES_JOBS:
          await this.handleNettoyerLesJobsCommandHandler.execute()
          break
        case Planificateur.JobType.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS:
          await this.handleJobUpdateMailingListConseillerCommandHandler.execute()
          break
        case Planificateur.JobType.RECUPERER_SITUATIONS_JEUNES_MILO:
          await this.handleJobRecupererSituationsJeunesMiloCommandHandler.execute()
          break
        case Planificateur.JobType.NETTOYER_LES_PIECES_JOINTES:
          await this.handleJobNettoyerPiecesJointesCommandHandler.execute()
          break
        case Planificateur.JobType.NETTOYER_LES_DONNEES:
          await this.handleJobNettoyerLesDonneesCommandHandler.execute()
          break
        case Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE:
          await this.handleJobNotifierRendezVousPECommandHandler.execute()
          break
        case Planificateur.JobType.MAJ_CODES_EVENEMENTS:
          await this.handleJobMettreAJourCodesEvenementsCommandHandler.execute()
          break
        case Planificateur.JobType.MAJ_AGENCE_AC:
          await this.handleJobAgenceAnimationCollectiveCommand.execute()
          break
        case Planificateur.JobType.FAKE:
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
