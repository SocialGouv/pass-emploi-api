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

    for (const nouvellesSuggestion of nouvellesSuggestions) {
      const suggestionExistante = suggestionsActuelles.find(
        suggestion =>
          suggestion.idFonctionnel === nouvellesSuggestion.idFonctionnel
      )

      if (suggestionExistante) {
        await this.suggestionRepository.save({
          ...suggestionExistante,
          dateMiseAJour: nouvellesSuggestion.dateMiseAJour
        })
      } else {
        await this.suggestionRepository.save(nouvellesSuggestion)
      }

      const suggestionsASupprimer = suggestionsActuelles.filter(
        suggestionActuelle => {
          return (
            !nouvellesSuggestions.find(
              nouvelleSuggestion =>
                nouvelleSuggestion.idFonctionnel ===
                suggestionActuelle.idFonctionnel
            ) &&
            suggestionActuelle.source ===
              Recherche.Suggestion.Source.POLE_EMPLOI
          )
        }
      )

      for (const suggestion of suggestionsASupprimer) {
        await this.suggestionRepository.delete(suggestion.id)
      }
    }
  }
}
