import { Offre } from '../../src/domain/offre/offre'
import { uneDatetime } from './date.fixture'

export const uneSuggestionPE = (
  args: Partial<Offre.Recherche.Suggestion.PoleEmploi> = {}
): Offre.Recherche.Suggestion.PoleEmploi => {
  const defaults: Offre.Recherche.Suggestion.PoleEmploi = {
    informations: {
      titre: 'Petrisseur',
      localisation: 'Lille',
      metier: 'Boulanger'
    },
    rome: 'D1104',
    texteRecherche: 'Petrisseur',
    localisation: {
      code: '59220',
      type: 'COMMUNE',
      rayon: 10
    }
  }
  return { ...defaults, ...args }
}

export const uneSuggestion = (
  args: Partial<Offre.Recherche.Suggestion> = {}
): Offre.Recherche.Suggestion => {
  const defaults: Offre.Recherche.Suggestion = {
    dateCreation: uneDatetime,
    dateMiseAJour: uneDatetime,
    id: 'f781ae20-8838-49c7-aa2e-9b224318fb65',
    idFonctionnel: 'D1104-COMMUNE-59220-10',
    idJeune: 'ABCDE',
    dateSuppression: undefined,
    type: Offre.Recherche.Type.OFFRES_EMPLOI,
    source: Offre.Recherche.Suggestion.Source.POLE_EMPLOI,
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
