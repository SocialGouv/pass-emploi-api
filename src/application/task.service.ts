import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { ExecuteJobAsapCommandHandler } from './commands/tasks/execute-cronjob-asap.command'
import { InitCronsCommandHandler } from './commands/tasks/init-crons.command'
import { SynchronizeJobsCommandHandler } from './commands/tasks/synchronize-jobs.command'

export enum Task {
  DUMMY_JOB = 'DUMMY_JOB',
  INIT_ALL_JOBS = 'INIT_ALL_JOBS',
  INITIALISER_LES_CRON = 'INITIALISER_LES_CRON'
}

@Injectable()
export class TaskService {
  private logger: Logger = new Logger('TaskService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler,
    private initCronsCommandHandler: InitCronsCommandHandler,
    private executeJobAsapCommandHandler: ExecuteJobAsapCommandHandler
  ) {}

  async handle(task: Task, date?: string): Promise<void> {
    this.logger.log(task)
    const isCronJob = task in Planificateur.CronJob
    try {
      if (isCronJob) {
        await this.executeJobAsapCommandHandler.execute({
          jobType: task as unknown as Planificateur.CronJob,
          date
        })
      } else {
        switch (task) {
          case Task.DUMMY_JOB:
            const job: Planificateur.Job = {
              date: new Date(),
              type: Planificateur.JobEnum.FAKE,
              contenu: { message: 'dummy job' }
            }
            await this.planificateurRepository.createJob(job)
            break
          case Task.INIT_ALL_JOBS:
            await this.synchronizeJobsCommandHandler.execute()
            break
          case Task.INITIALISER_LES_CRON:
            await this.initCronsCommandHandler.execute()
            break
          default:
            this.logger.log(
              `Tache ${task} non connue, voici les tâches possibles : ${Object.values(
                Task
              )}`
            )
        }
      }
    } catch (e) {
      this.logger.error(e)
    }
  }
}
