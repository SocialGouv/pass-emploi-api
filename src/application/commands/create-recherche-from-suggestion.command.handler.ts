import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { MauvaiseCommandeError } from 'src/building-blocks/types/domain-error'
import {
  Recherche,
  RecherchesRepositoryToken
} from 'src/domain/offre/recherche/recherche'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from 'src/domain/offre/recherche/suggestion/suggestion'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { SuggestionAuthorizer } from '../authorizers/authorize-suggestion'

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
    private suggestionFactory: Suggestion.Factory
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

  async monitor(): Promise<void> {
    return
  }

  async authorize(
    command: CreateRechercheFromSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.suggestionAuthorizer.authorize(
      command.idSuggestion,
      command.idJeune,
      utilisateur
    )
  }
}
