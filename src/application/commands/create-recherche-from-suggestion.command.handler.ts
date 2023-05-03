import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import {
  Result,
  failure,
  isFailure,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { EvenementService } from '../../domain/evenement'
import {
  Recherche,
  RecherchesRepositoryToken
} from '../../domain/offre/recherche/recherche'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { SuggestionAuthorizer } from '../authorizers/suggestion-authorizer'

export interface CreateRechercheFromSuggestionCommand extends Command {
  idJeune: string
  idSuggestion: string
}

@Injectable()
export class CreateRechercheFromSuggestionCommandHandler extends CommandHandler<
  CreateRechercheFromSuggestionCommand,
  Recherche
> {
  constructor(
    private suggestionAuthorizer: SuggestionAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    private rechercheFactory: Recherche.Factory,
    private suggestionFactory: Suggestion.Factory,
    private evenementService: EvenementService
  ) {
    super('CreateRechercheFromSuggestionCommandHandler')
  }

  async handle(
    command: CreateRechercheFromSuggestionCommand
  ): Promise<Result<Recherche>> {
    const suggestion = await this.suggestionRepository.get(command.idSuggestion)

    if (!suggestion) {
      return failure(new MauvaiseCommandeError('Suggestion non trouvée'))
    }

    const suggestionAccepteeResult = this.suggestionFactory.accepter(suggestion)
    if (isFailure(suggestionAccepteeResult)) {
      return suggestionAccepteeResult
    }

    const recherche = this.rechercheFactory.buildRechercheFromSuggestion(
      suggestionAccepteeResult.data
    )

    await this.rechercheRepository.save(recherche)
    await this.suggestionRepository.save(suggestionAccepteeResult.data)

    return success(recherche)
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateRechercheFromSuggestionCommand
  ): Promise<void> {
    await this.evenementService.creerEvenementSuggestion(
      utilisateur,
      command.idSuggestion
    )
  }

  async authorize(
    command: CreateRechercheFromSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.suggestionAuthorizer.autoriserJeunePourSaSuggestion(
      command.idJeune,
      command.idSuggestion,
      utilisateur
    )
  }
}
