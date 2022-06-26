import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous'

@Injectable()
export class SynchronizeJobsCommandHandler extends CommandHandler<
  Command,
  void
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('SynchronizeJobsTask')
  }

  async handle(): Promise<Result> {
    await this.planificateurRepository.supprimerTousLesJobs()

    const rendezVous = await this.rendezVousRepository.getAllAVenir()
    this.logger.log('Création des jobs rendez vous')
    for (const rdv of rendezVous) {
      await this.planificateurService.planifierRappelsRendezVous(rdv)
    }

    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
