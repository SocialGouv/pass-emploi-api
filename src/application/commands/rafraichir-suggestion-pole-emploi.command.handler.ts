import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Inject, Injectable } from '@nestjs/common'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import {
  Suggestion,
  SuggestionsPoleEmploiRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { SuggestionPoleEmploiService } from '../../domain/offre/recherche/suggestion/pole-emploi.service'

export interface RafraichirSuggestionPoleEmploiCommand extends Command {
  idJeune: string
  token: string
}

@Injectable()
export class RafraichirSuggestionPoleEmploiCommandHandler extends CommandHandler<
  RafraichirSuggestionPoleEmploiCommand,
  void
> {
  constructor(
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
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

    const suggestionsPE = await this.suggestionPoleEmploiRepository.findAll(
      idpToken
    )

    if (isFailure(suggestionsPE)) {
      return suggestionsPE
    }

    const suggestions = suggestionsPE.data.map(suggestion =>
      this.suggestionFactory.fromPoleEmploi(suggestion, command.idJeune)
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
    return this.jeunePoleEmploiAuthorizer.authorize(
      command.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
