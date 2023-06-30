import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Inject, Injectable } from '@nestjs/common'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import {
  Suggestion,
  SuggestionsPoleEmploiRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { SuggestionPoleEmploiService } from '../../domain/offre/recherche/suggestion/pole-emploi.service'
import { Core, estPoleEmploiBRSA } from '../../domain/core'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { DiagorienteClient } from 'src/infrastructure/clients/diagoriente-client'
import { buildError } from '../../utils/logger.module'

export interface RafraichirSuggestionsCommand extends Command {
  idJeune: string
  token: string
  structure: Core.Structure
  avecDiagoriente: boolean
}

@Injectable()
export class RafraichirSuggestionsCommandHandler extends CommandHandler<
  RafraichirSuggestionsCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private suggestionFactory: Suggestion.Factory,
    private suggestionPoleEmploiService: SuggestionPoleEmploiService,
    private readonly diagorienteClient: DiagorienteClient,
    @Inject(SuggestionsPoleEmploiRepositoryToken)
    private suggestionPoleEmploiRepository: Suggestion.PoleEmploi.Repository,
    private keycloakClient: KeycloakClient
  ) {
    super('RafraichirSuggestionsCommandHandler')
  }

  async handle(command: RafraichirSuggestionsCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    let suggestionsPE: Suggestion[] = []
    let suggestionsDiagoriente: Suggestion[] = []
    const rafraichirSuggestionsPE = estPoleEmploiBRSA(command.structure)
    const rafraichirSuggestionsDiagoriente = command.avecDiagoriente

    if (rafraichirSuggestionsPE) {
      const idpToken = await this.keycloakClient.exchangeTokenJeune(
        command.token,
        jeune.structure
      )
      const suggestionsPEResult =
        await this.suggestionPoleEmploiRepository.findAll(idpToken)

      if (isFailure(suggestionsPEResult)) {
        this.logger.error(
          buildError(
            `Impossible de récupérer les suggestions depuis PE`,
            Error(suggestionsPEResult.error.message)
          )
        )
      } else {
        suggestionsPE =
          this.suggestionFactory.buildListeSuggestionsOffresFromPoleEmploi(
            suggestionsPEResult.data,
            command.idJeune,
            command.structure
          )
      }
    }

    if (rafraichirSuggestionsDiagoriente) {
      const metiersFavorisDiagorienteResult =
        await this.diagorienteClient.getMetiersFavoris(jeune.id)

      if (isFailure(metiersFavorisDiagorienteResult)) {
        this.logger.error(
          buildError(
            'Impossible de récupérer les métiers favoris depuis Diagoriente',
            Error(metiersFavorisDiagorienteResult.error.message)
          )
        )
      } else {
        const metiersFavorisDiagoriente =
          metiersFavorisDiagorienteResult.data.data.userByPartner?.favorites.filter(
            favori => favori.favorited
          ) ?? []
        suggestionsDiagoriente =
          this.suggestionFactory.buildListeSuggestionsOffresFromDiagoriente(
            metiersFavorisDiagoriente,
            command.idJeune
          )
      }
    }

    const suggestionsARafraichir = [...suggestionsPE, ...suggestionsDiagoriente]
    if (suggestionsARafraichir.length > 0) {
      await this.suggestionPoleEmploiService.rafraichir(
        suggestionsARafraichir,
        command.idJeune
      )
    }

    return emptySuccess()
  }

  authorize(
    command: RafraichirSuggestionsCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
