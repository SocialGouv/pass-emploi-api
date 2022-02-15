import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { SynchronizeJobsCommandHandler } from './commands/synchronize-jobs.command'
import JobEnum = Planificateur.JobEnum
import { NotifierNouvellesOffresEmploiCommandHandler } from './commands/jobs/handle-job-notification-recherche.command'
import { InitJobsCommandHandler } from './commands/init-jobs.command'

export enum Task {
  DUMMY_JOB = 'DUMMY_JOB',
  INIT_ALL_JOBS = 'INIT_ALL_JOBS',
  RECHERCHER_LES_NOUVELLES_OFFRES = 'RECHERCHER_LES_NOUVELLES_OFFRES',
  INITIALISER_LES_CRON = 'INITIALISER_LES_CRON'
}

@Injectable()
export class TaskService {
  private logger: Logger = new Logger('TaskService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler,
    private notifierNouvellesOffresEmploiCommandHandler: NotifierNouvellesOffresEmploiCommandHandler,
    private initJobsCommandHandler: InitJobsCommandHandler
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
          await this.synchronizeJobsCommandHandler.execute({})
          break
        case Task.RECHERCHER_LES_NOUVELLES_OFFRES:
          await this.notifierNouvellesOffresEmploiCommandHandler.execute({})
          break
        case Task.INITIALISER_LES_CRON:
          await this.initJobsCommandHandler.execute({})
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
