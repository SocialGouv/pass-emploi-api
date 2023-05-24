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

export interface RafraichirSuggestionPoleEmploiCommand extends Command {
  idJeune: string
  token: string
  structure: Core.Structure
  avecDiagoriente: boolean
}

@Injectable()
export class RafraichirSuggestionPoleEmploiCommandHandler extends CommandHandler<
  RafraichirSuggestionPoleEmploiCommand,
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
    super('RafraichirSuggestionPoleEmploiCommandHandler')
  }

  async handle(
    command: RafraichirSuggestionPoleEmploiCommand
  ): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    let suggestionsDiagoriente: Suggestion[] = []
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }
    const idpToken = await this.keycloakClient.exchangeTokenJeune(
      command.token,
      jeune.structure
    )

    const suggestionsPEResult =
      await this.suggestionPoleEmploiRepository.findAll(idpToken)

    if (isFailure(suggestionsPEResult)) {
      return suggestionsPEResult
    }

    if (command.avecDiagoriente) {
      const metiersFavorisDiagorienteResult =
        await this.diagorienteClient.getMetiersFavoris(jeune.id)

      if (isFailure(metiersFavorisDiagorienteResult)) {
        return metiersFavorisDiagorienteResult
      }

      const metiersFavorisDiagoriente =
        metiersFavorisDiagorienteResult.data.data.userByPartner.favorites.filter(
          favori => favori.favorited
        )

      suggestionsDiagoriente =
        this.suggestionFactory.buildListeSuggestionsOffresFromDiagoriente(
          metiersFavorisDiagoriente,
          command.idJeune
        )
    }

    const suggestionsPE =
      this.suggestionFactory.buildListeSuggestionsOffresFromPoleEmploi(
        suggestionsPEResult.data,
        command.idJeune,
        command.structure
      )

    await this.suggestionPoleEmploiService.rafraichir(
      [...suggestionsPE, ...suggestionsDiagoriente],
      command.idJeune
    )

    return emptySuccess()
  }

  authorize(
    command: RafraichirSuggestionPoleEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      command.idJeune,
      utilisateur,
      estPoleEmploiBRSA(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
