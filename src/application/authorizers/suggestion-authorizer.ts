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
  ) {}

  async autoriserJeunePourSaSuggestion(
    idJeune: string,
    idSuggestion: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      Authentification.estJeune(utilisateur.type) &&
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
