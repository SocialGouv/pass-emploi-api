import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isSuccess,
  Result
} from '../../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous'
import { Action, ActionsRepositoryToken } from '../../../domain/action'

@Injectable()
export class SynchronizeJobsCommandHandler extends CommandHandler<
  Command,
  void
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository,
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private actionFactory: Action.Factory
  ) {
    super('SynchronizeJobsTask')
  }

  async handle(): Promise<Result> {
    await this.planificateurRepository.supprimerTousLesJobs()

    await this.planifierRappelsRdvs()
    await this.planifierRappelsActions()

    return emptySuccess()
  }

  private async planifierRappelsRdvs(): Promise<void> {
    const rendezVous = await this.rendezVousRepository.getAllAVenir()
    this.logger.log('Création des jobs rendez vous')
    for (const rdv of rendezVous) {
      await this.planificateurService.planifierRappelsRendezVous(rdv)
    }
  }

  private async planifierRappelsActions(): Promise<void> {
    const actions = await this.actionRepository.findAllActionsARappeler()

    this.logger.log('Création des jobs rappels actions')
    for (const action of actions) {
      if (
        isSuccess(this.actionFactory.doitEnvoyerUneNotificationDeRappel(action))
      )
        await this.planificateurService.planifierRappelAction(action)
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
