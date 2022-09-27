import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from 'src/domain/offre/recherche/suggestion/suggestion'
import { DateService } from 'src/utils/date-service'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface DeleteSuggestionCommand extends Command {
  idJeune: string
  idSuggestion: string
}

@Injectable()
export class DeleteSuggestionCommandHandler extends CommandHandler<
  DeleteSuggestionCommand,
  void
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    private dateService: DateService
  ) {
    super('DeleteSuggestionCommandHandler')
  }

  async handle(command: DeleteSuggestionCommand): Promise<Result<void>> {
    const suggestion = await this.suggestionRepository.findByIdAndIdJeune(
      command.idSuggestion,
      command.idJeune
    )

    if (!suggestion) {
      return failure(new NonTrouveError('Suggestion', command.idSuggestion))
    }

    await this.suggestionRepository.save({
      ...suggestion,
      dateSuppression: this.dateService.now()
    })

    return emptySuccess()
  }

  async monitor(_utilisateur: Authentification.Utilisateur): Promise<void> {
    return
  }

  authorize(
    query: DeleteSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }
}
