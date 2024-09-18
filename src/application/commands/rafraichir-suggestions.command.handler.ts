import { Inject, Injectable } from '@nestjs/common'
import { DiagorienteClient } from 'src/infrastructure/clients/diagoriente-client'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core, estPoleEmploiOuCD } from '../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { SuggestionPoleEmploiService } from '../../domain/offre/recherche/suggestion/pole-emploi.service'
import {
  Suggestion,
  SuggestionsPoleEmploiRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client.db'
import { buildError } from '../../utils/logger.module'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export interface RafraichirSuggestionsCommand extends Command {
  idJeune: string
  accessToken: string
  structure: Core.Structure
  avecDiagoriente: boolean
}

@Injectable()
export class RafraichirSuggestionsCommandHandler extends CommandHandler<
  RafraichirSuggestionsCommand,
  void
> {
  constructor(
    @Inject(JeuneRepositoryToken)
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
    const rafraichirSuggestionsPE = estPoleEmploiOuCD(command.structure)
    const rafraichirSuggestionsDiagoriente = command.avecDiagoriente

    if (rafraichirSuggestionsPE) {
      try {
        const idpToken = await this.keycloakClient.exchangeTokenJeune(
          command.accessToken,
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
      } catch (e) {
        this.logger.error(buildError(`Erreur récupération suggestions PE`, e))
      }
    }

    if (rafraichirSuggestionsDiagoriente) {
      try {
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
      } catch (e) {
        this.logger.error(
          buildError(`Erreur récupération suggestions Diagoriente`, e)
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
