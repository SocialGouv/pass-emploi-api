import { Inject, Injectable } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../../../domain/planificateur'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'

@Injectable()
export class InitCronsCommandHandler extends CommandHandler<Command, void> {
  constructor(
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('InitCronsCommandHandler')
  }

  async handle(): Promise<Result> {
    await this.planificateurRepository.supprimerLesCronJobs()
    await this.planificateurService.planifierLesCronJobs()
    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
