import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { PlanifierExecutionCronCommandHandler } from './tasks/planifier-execution-cron.command.handler'
import { InitCronsCommandHandler } from './tasks/init-crons.command'
import { SynchronizeJobsCommandHandler } from './tasks/synchronize-jobs.command'

export enum Task {
  DUMMY_JOB = 'DUMMY_JOB',
  INIT_JOBS = 'INIT_JOBS',
  INIT_CRONS = 'INIT_CRONS'
}

@Injectable()
export class TaskService {
  private logger: Logger = new Logger('TaskService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler,
    private initCronsCommandHandler: InitCronsCommandHandler,
    private planifierExecutionCronCommandHandler: PlanifierExecutionCronCommandHandler
  ) {}

  async handle(task: Task, date?: string): Promise<void> {
    this.logger.log(task)
    const isCronJob = task in Planificateur.JobType
    try {
      if (isCronJob) {
        await this.planifierExecutionCronCommandHandler.execute({
          jobType: task as unknown as Planificateur.JobType,
          dateExecution: date
        })
      } else {
        switch (task) {
          case Task.DUMMY_JOB:
            const job: Planificateur.Job = {
              dateExecution: new Date(),
              type: Planificateur.JobType.FAKE,
              contenu: { message: 'dummy job' }
            }
            await this.planificateurRepository.ajouterJob(job)
            break
          case Task.INIT_JOBS:
            await this.synchronizeJobsCommandHandler.execute()
            break
          case Task.INIT_CRONS:
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
