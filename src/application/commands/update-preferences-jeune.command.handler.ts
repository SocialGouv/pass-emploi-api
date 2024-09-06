import { Command } from '../../building-blocks/types/command'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Evenement, EvenementService } from '../../domain/evenement'

export interface UpdateJeunePreferencesCommand extends Command {
  idJeune: string
  partageFavoris: boolean
  alertesOffres: boolean
  messages: boolean
  creationActionConseiller: boolean
  rendezVousSessions: boolean
  rappelActions: boolean
}

@Injectable()
export class UpdateJeunePreferencesCommandHandler extends CommandHandler<
  UpdateJeunePreferencesCommand,
  void
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly evenementService: EvenementService
  ) {
    super('UpdateJeunePreferencesCommandHandler')
  }

  async handle(command: UpdateJeunePreferencesCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }
    const jeuneAJour: Jeune = {
      ...jeune,
      preferences: {
        partageFavoris: command.partageFavoris,
        alertesOffres: command.alertesOffres,
        messages: command.messages,
        creationActionConseiller: command.creationActionConseiller,
        rendezVousSessions: command.rendezVousSessions,
        rappelActions: command.rappelActions
      }
    }
    await this.jeuneRepository.save(jeuneAJour)
    return emptySuccess()
  }

  async authorize(
    command: UpdateJeunePreferencesCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.PREFERENCES_MISES_A_JOUR,
      utilisateur
    )
  }
}
