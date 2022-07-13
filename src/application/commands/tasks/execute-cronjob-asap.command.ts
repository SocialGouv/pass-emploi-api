import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../../domain/planificateur'
import { DateService } from '../../../utils/date-service'

export interface ExecuteCronJobAsapCommand extends Command {
  jobType: Planificateur.CronJob
}

@Injectable()
export class ExecuteCronJobAsapCommandHandler extends CommandHandler<
  ExecuteCronJobAsapCommand,
  void
> {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService
  ) {
    super('ExecuteCronJobAsapCommandHandler')
  }

  async handle(command: ExecuteCronJobAsapCommand): Promise<Result> {
    const job: Planificateur.Job<undefined> = {
      date: this.dateService.nowJs(),
      type: command.jobType,
      contenu: undefined
    }
    await this.planificateurRepository.createJob(job)
    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
