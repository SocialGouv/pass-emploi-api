import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'

@Injectable()
export class SuggestionAuthorizer {
  constructor(
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository
  ) { }

  async authorize(
    idSuggestion: string,
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      const suggestion = await this.suggestionRepository.get(idSuggestion)

      if (suggestion && suggestion.idJeune === idJeune) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
