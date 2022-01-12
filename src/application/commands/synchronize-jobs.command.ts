import { Inject, Injectable } from '@nestjs/common'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../../domain/planificateur'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'

@Injectable()
export class SynchronizeJobsCommandHandler extends CommandHandler<
  Command,
  void
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('SynchronizeJobsTask')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(_command: Command): Promise<Result> {
    await this.planificateurRepository.supprimerTousLesJobs()

    const conseillersIds = await this.conseillerRepository.getAllIds()

    this.logger.log('Création des jobs conseillers')
    conseillersIds.forEach(id => {
      this.planificateurService.planifierJobRappelMail(id)
    })

    const rendezVous = await this.rendezVousRepository.getAllAVenir()
    this.logger.log('Création des jobs rendez vous')
    rendezVous.forEach(rdv => {
      this.planificateurService.planifierRappelsRendezVous(rdv)
    })

    return emptySuccess()
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
