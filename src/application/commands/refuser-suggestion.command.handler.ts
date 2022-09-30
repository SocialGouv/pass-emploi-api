import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { MauvaiseCommandeError } from 'src/building-blocks/types/domain-error'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from 'src/domain/offre/recherche/suggestion/suggestion'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { SuggestionAuthorizer } from '../authorizers/authorize-suggestion'

export interface RefuserSuggestionCommand extends Command {
  idJeune: string
  idSuggestion: string
}

@Injectable()
export class RefuserSuggestionCommandHandler extends CommandHandler<
  RefuserSuggestionCommand,
  void
> {
  constructor(
    private suggestionAuthorizer: SuggestionAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    private suggestionFactory: Suggestion.Factory
  ) {
    super('DeleteSuggestionCommandHandler')
  }

  async handle(command: RefuserSuggestionCommand): Promise<Result<void>> {
    const suggestion = await this.suggestionRepository.get(command.idSuggestion)

    if (!suggestion || Suggestion.estTraitee(suggestion)) {
      return failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
    }

    const suggestionRefusee = this.suggestionFactory.refuser(suggestion)

    await this.suggestionRepository.save(suggestionRefusee)

    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  async authorize(
    command: RefuserSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.suggestionAuthorizer.authorize(
      command.idSuggestion,
      command.idJeune,
      utilisateur
    )
  }
}
