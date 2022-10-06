import { Inject, Injectable } from '@nestjs/common'
import { Suggestion, SuggestionsRepositoryToken } from './suggestion'
import { Recherche } from '../recherche'

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
    const suggestions = await this.suggestionRepository.findAll(idJeune)

    for (const nouvelleSuggestion of nouvellesSuggestions) {
      const suggestionExistante = suggestions.find(suggestion =>
        Suggestion.sontEquivalentes(suggestion, nouvelleSuggestion)
      )

      if (suggestionExistante) {
        await this.suggestionRepository.save({
          ...suggestionExistante,
          dateRafraichissement: nouvelleSuggestion.dateRafraichissement
        })
      } else {
        await this.suggestionRepository.save(nouvelleSuggestion)
      }
    }
  }
}
