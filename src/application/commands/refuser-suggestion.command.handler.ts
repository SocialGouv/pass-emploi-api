import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure,
  isFailure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { EvenementService } from '../../domain/evenement'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { SuggestionAuthorizer } from '../authorizers/suggestion-authorizer'

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
    private suggestionFactory: Suggestion.Factory,
    private evenementService: EvenementService
  ) {
    super('DeleteSuggestionCommandHandler')
  }

  async handle(command: RefuserSuggestionCommand): Promise<Result<void>> {
    const suggestion = await this.suggestionRepository.get(command.idSuggestion)

    if (!suggestion) {
      return failure(new MauvaiseCommandeError('Suggestion non trouvée'))
    }

    const suggestionRefuseeResult = this.suggestionFactory.refuser(suggestion)
    if (isFailure(suggestionRefuseeResult)) {
      return suggestionRefuseeResult
    }

    await this.suggestionRepository.save(suggestionRefuseeResult.data)

    return emptySuccess()
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: RefuserSuggestionCommand
  ): Promise<void> {
    await this.evenementService.creerEvenementSuggestion(
      utilisateur,
      command.idSuggestion
    )
  }

  async authorize(
    command: RefuserSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.suggestionAuthorizer.autoriserJeunePourSaSuggestion(
      command.idJeune,
      command.idSuggestion,
      utilisateur
    )
  }
}
