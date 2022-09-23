import { Inject, Injectable } from '@nestjs/common'
import { SuggestionsRepositoryToken } from './suggestion'
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
    const suggestionsActuelles = await this.suggestionRepository.findAll(
      idJeune
    )

    for (const nouvelleSuggestion of nouvellesSuggestions) {
      const suggestionExistante = suggestionsActuelles.find(
        suggestion =>
          suggestion.idFonctionnel === nouvelleSuggestion.idFonctionnel
      )

      if (suggestionExistante) {
        await this.suggestionRepository.save({
          ...suggestionExistante,
          dateMiseAJour: nouvelleSuggestion.dateMiseAJour
        })
      } else {
        await this.suggestionRepository.save(nouvelleSuggestion)
      }
    }
  }
}
