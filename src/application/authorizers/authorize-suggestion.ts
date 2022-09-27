import { Inject, Injectable } from '@nestjs/common'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from 'src/domain/offre/recherche/suggestion/suggestion'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'

@Injectable()
export class SuggestionAuthorizer {
  constructor(
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository
  ) {}

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
