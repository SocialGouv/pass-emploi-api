import { Suggestion } from 'src/domain/offre/recherche/suggestion/suggestion'
import { Offre } from '../../src/domain/offre/offre'
import { uneDatetime } from './date.fixture'
import { Recherche } from '../../src/domain/offre/recherche/recherche'

export const uneSuggestionPE = (
  args: Partial<Offre.Recherche.Suggestion.PoleEmploi> = {}
): Offre.Recherche.Suggestion.PoleEmploi => {
  const defaults: Offre.Recherche.Suggestion.PoleEmploi = {
    titreMetier: 'Petrisseur',
    categorieMetier: 'Boulanger',
    codeRome: 'D1104',
    texteRecherche: 'Petrisseur',
    localisation: {
      libelle: 'test',
      code: '59220',
      type: Suggestion.TypeLocalisation.COMMUNE,
      lat: 1,
      lon: 1
    }
  }
  return { ...defaults, ...args }
}

export const uneSuggestion = (
  args: Partial<Offre.Recherche.Suggestion> = {}
): Offre.Recherche.Suggestion => {
  const defaults: Offre.Recherche.Suggestion = {
    dateCreation: uneDatetime(),
    dateRafraichissement: uneDatetime(),
    id: 'f781ae20-8838-49c7-aa2e-9b224318fb65',
    idFonctionnel: {
      typeRecherche: Recherche.Type.OFFRES_EMPLOI,
      typeLocalisation: Suggestion.TypeLocalisation.COMMUNE,
      codeLocalisation: '59220',
      rayon: Recherche.DISTANCE_PAR_DEFAUT,
      codeRome: 'D1104'
    },
    idJeune: 'ABCDE',
    type: Offre.Recherche.Type.OFFRES_EMPLOI,
    source: Suggestion.Source.POLE_EMPLOI,
    informations: {
      titre: 'Petrisseur',
      localisation: 'Lille',
      metier: 'Boulanger'
    },
    criteres: {
      q: 'Petrisseur',
      commune: '59220',
      departement: undefined,
      rayon: 10
    }
  }
  return { ...defaults, ...args }
}
