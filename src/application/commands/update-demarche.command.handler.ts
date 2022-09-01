import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { isFailure, Result } from '../../building-blocks/types/result'
import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Demarche, DemarcheRepositoryToken } from '../../domain/demarche'

export interface UpdateStatutDemarcheCommand extends Command {
  idJeune: string
  accessToken: string
  idDemarche: string
  dateDebut?: Date
  dateFin: Date
  statut: Demarche.Statut
}

@Injectable()
export class UpdateStatutDemarcheCommandHandler extends CommandHandler<
  UpdateStatutDemarcheCommand,
  Demarche
> {
  constructor(
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private evenementService: EvenementService,
    private demarcheFactory: Demarche.Factory,
    @Inject(DemarcheRepositoryToken)
    private demarcheRepository: Demarche.Repository
  ) {
    super('UpdateStatutDemarcheCommandHandler')
  }

  async authorize(
    command: UpdateStatutDemarcheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(
      command.idJeune,
      utilisateur
    )
  }

  async handle(
    command: UpdateStatutDemarcheCommand
  ): Promise<Result<Demarche>> {
    const result = this.demarcheFactory.mettreAJourLeStatut(
      command.idDemarche,
      command.statut,
      command.dateFin,
      command.dateDebut
    )

    if (isFailure(result)) {
      return result
    }

    return this.demarcheRepository.update(result.data, command.accessToken)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.ACTION_STATUT_MODIFIE,
      utilisateur
    )
  }
}
