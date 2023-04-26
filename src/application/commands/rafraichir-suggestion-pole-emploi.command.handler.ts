import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
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
import { Core } from '../../domain/core'

export interface RafraichirSuggestionPoleEmploiCommand extends Command {
  idJeune: string
  token: string
  structure: Core.Structure
}

@Injectable()
export class RafraichirSuggestionPoleEmploiCommandHandler extends CommandHandler<
  RafraichirSuggestionPoleEmploiCommand,
  void
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private suggestionFactory: Suggestion.Factory,
    private suggestionPoleEmploiService: SuggestionPoleEmploiService,
    @Inject(SuggestionsPoleEmploiRepositoryToken)
    private suggestionPoleEmploiRepository: Suggestion.PoleEmploi.Repository,
    private keycloakClient: KeycloakClient
  ) {
    super('RafraichirSuggestionPoleEmploiCommandHandler')
  }

  async handle(
    command: RafraichirSuggestionPoleEmploiCommand
  ): Promise<Result> {
    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      command.token
    )

    const suggestionsPEResult =
      await this.suggestionPoleEmploiRepository.findAll(idpToken)

    if (isFailure(suggestionsPEResult)) {
      return suggestionsPEResult
    }

    const suggestions =
      this.suggestionFactory.buildListeSuggestionsOffresFromPoleEmploi(
        suggestionsPEResult.data,
        command.idJeune,
        command.structure
      )

    await this.suggestionPoleEmploiService.rafraichir(
      suggestions,
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
      Core.structuresPoleEmploiBRSA
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
