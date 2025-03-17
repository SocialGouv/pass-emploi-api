import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../domain/planificateur'
import { DateService } from '../../utils/date-service'

export interface PlanifierExecutionCronCommand extends Command {
  jobType: Planificateur.JobType
  dateExecution?: string
}

@Injectable()
export class PlanifierExecutionCronCommandHandler extends CommandHandler<
  PlanifierExecutionCronCommand,
  void
> {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService
  ) {
    super('ExecuteCronJobAsapCommandHandler')
  }

  async handle(command: PlanifierExecutionCronCommand): Promise<Result> {
    const job: Planificateur.Job<undefined> = {
      dateExecution: command.dateExecution
        ? new Date(command.dateExecution)
        : this.dateService.nowJs(),
      type: command.jobType,
      contenu: undefined
    }
    await this.planificateurRepository.ajouterJob(job)
    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
