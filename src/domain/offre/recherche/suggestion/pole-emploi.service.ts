import { Inject, Injectable } from '@nestjs/common'
import { Suggestion, SuggestionsRepositoryToken } from './suggestion'
import { Recherche } from '../recherche'
import estTraitee = Suggestion.estTraitee

@Injectable()
export class SuggestionPoleEmploiService {
  constructor(
    @Inject(SuggestionsRepositoryToken)
    private readonly suggestionRepository: Recherche.Suggestion.Repository
  ) {}

  async rafraichir(
    nouvellesSuggestions: Recherche.Suggestion[],
    idJeune: string
  ): Promise<void> {
    const allSuggestions = await this.suggestionRepository.findAll(idJeune)
    const suggestionsNonTraitees = allSuggestions.filter(
      suggestion => !estTraitee(suggestion)
    )

    for (const nouvelleSuggestion of nouvellesSuggestions) {
      const suggestionNonTraiteeExistante = suggestionsNonTraitees.find(
        suggestionNonTraitee =>
          Suggestion.sontEquivalentes(suggestionNonTraitee, nouvelleSuggestion)
      )

      if (suggestionNonTraiteeExistante) {
        await this.suggestionRepository.save({
          ...suggestionNonTraiteeExistante,
          dateRafraichissement: nouvelleSuggestion.dateRafraichissement
        })
      } else {
        await this.suggestionRepository.save(nouvelleSuggestion)
      }
    }
  }
}
