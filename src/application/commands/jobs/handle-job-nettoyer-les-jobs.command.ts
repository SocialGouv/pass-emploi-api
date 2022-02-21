import { Inject, Injectable } from '@nestjs/common'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../../domain/planificateur'

@Injectable()
export class HandleNettoyerLesJobsCommandHandler extends CommandHandler<
  Command,
  void
> {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('HandleNettoyerLesJobsCommandHandler')
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<Result> {
    try {
      await this.planificateurRepository.supprimerLesAnciensJobs()
      return emptySuccess()
    } catch (e) {
      return failure(e)
    }
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
