import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { HandleJobUpdateMailingListConseillerCommandHandler } from './commands/jobs/handle-job-update-mailing-list-conseiller.command'
import { SynchronizeJobsCommandHandler } from './commands/tasks/synchronize-jobs.command'
import JobEnum = Planificateur.JobEnum
import { HandleJobMailConseillerCommandHandler } from './commands/jobs/handle-job-mail-conseiller.command'
import { HandleNettoyerLesJobsCommandHandler } from './commands/jobs/handle-job-nettoyer-les-jobs.command'
import { InitCronsCommandHandler } from './commands/tasks/init-crons.command'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from './commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from './commands/jobs/handle-job-notification-recherche-service-civique.command.handler'

export enum Task {
  DUMMY_JOB = 'DUMMY_JOB',
  INIT_ALL_JOBS = 'INIT_ALL_JOBS',
  RECHERCHER_LES_NOUVELLES_OFFRES = 'RECHERCHER_LES_NOUVELLES_OFFRES',
  RECHERCHER_LES_NOUVELLES_OFFRES_SERVICES_CIVIQUE = 'RECHERCHER_LES_NOUVELLES_OFFRES_SERVICES_CIVIQUE',
  ENVOYER_MAIL_CONSEILLER_MESSAGES = 'ENVOYER_MAIL_CONSEILLER_MESSAGES',
  INITIALISER_LES_CRON = 'INITIALISER_LES_CRON',
  NETTOYER_LES_JOBS = 'NETTOYER_LES_JOBS',
  METTRE_A_JOUR_MAILING_LIST_CONSEILLER = 'METTRE_A_JOUR_MAILING_LIST_CONSEILLER'
}

@Injectable()
export class TaskService {
  private logger: Logger = new Logger('TaskService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler,
    private notifierNouvellesOffresEmploiCommandHandler: HandleJobNotifierNouvellesOffresEmploiCommandHandler,
    private handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler,
    private initCronsCommandHandler: InitCronsCommandHandler,
    private handleNettoyerLesJobsCommandHandler: HandleNettoyerLesJobsCommandHandler,
    private handleJobUpdateMailingListConseillerCommandHandler: HandleJobUpdateMailingListConseillerCommandHandler,
    private handleJobNotifierNouveauxServicesCiviqueCommandHandler: HandleJobNotifierNouveauxServicesCiviqueCommandHandler
  ) {}

  async handle(task: Task | undefined): Promise<void> {
    this.logger.log(task)
    try {
      switch (task) {
        case Task.DUMMY_JOB:
          const job: Planificateur.Job = {
            date: new Date(),
            type: JobEnum.FAKE,
            contenu: { message: 'dummy job' }
          }
          await this.planificateurRepository.createJob(job)
          break
        case Task.INIT_ALL_JOBS:
          await this.synchronizeJobsCommandHandler.execute()
          break
        case Task.RECHERCHER_LES_NOUVELLES_OFFRES:
          await this.notifierNouvellesOffresEmploiCommandHandler.execute()
          break
        case Task.ENVOYER_MAIL_CONSEILLER_MESSAGES:
          await this.handleJobMailConseillerCommandHandler.execute()
          break
        case Task.INITIALISER_LES_CRON:
          await this.initCronsCommandHandler.execute()
          break
        case Task.NETTOYER_LES_JOBS:
          await this.handleNettoyerLesJobsCommandHandler.execute()
          break
        case Task.METTRE_A_JOUR_MAILING_LIST_CONSEILLER:
          await this.handleJobUpdateMailingListConseillerCommandHandler.execute()
          break
        case Task.RECHERCHER_LES_NOUVELLES_OFFRES_SERVICES_CIVIQUE:
          await this.handleJobNotifierNouveauxServicesCiviqueCommandHandler.execute()
          break
        default:
          this.logger.log(
            `Tache non connue, voici les tâches possibles : ${Object.values(
              Task
            )}`
          )
      }
    } catch (e) {
      this.logger.error(e)
    }
  }
}
