import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { SynchronizeJobsCommandHandler } from './commands/synchronize-jobs.command'
import JobEnum = Planificateur.JobEnum

export enum Task {
  DUMMY_JOB = 'DUMMY_JOB',
  INIT_ALL_JOBS = 'INIT_ALL_JOBS'
}

@Injectable()
export class TaskService {
  private logger: Logger = new Logger('TaskService')

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler
  ) {}

  async handle(task: Task | undefined): Promise<void> {
    this.logger.log(task)
    try {
      if (task === Task.DUMMY_JOB) {
        const job: Planificateur.Job = {
          date: new Date(),
          type: JobEnum.FAKE,
          contenu: { message: 'dummy job' }
        }
        await this.planificateurRepository.createJob(job)
      } else if (task === Task.INIT_ALL_JOBS) {
        await this.synchronizeJobsCommandHandler.execute({})
      }
    } catch (e) {
      this.logger.error(e)
    }
  }
}
