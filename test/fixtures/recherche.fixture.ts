import { Recherche } from 'src/domain/recherche'
import { uneDatetimeMoinsRecente } from './date.fixture'

export const uneRecherche = (args: Partial<Recherche> = {}): Recherche => {
  const defaults = {
    id: '219e8ba5-cd88-4027-9828-55e8ca99a236',
    type: Recherche.Type.OFFRES_ALTERNANCE,
    metier: 'Boulanger',
    titre: 'Boulanger en alternance',
    localisation: 'Paris',
    criteres: {
      commune: '75017',
      query: 'Boulanger'
    },
    dateCreation: uneDatetimeMoinsRecente.toJSDate(),
    dateDerniereRecherche: uneDatetimeMoinsRecente.toJSDate(),
    idJeune: '1',
    etat: Recherche.Etat.SUCCES
  }

  return { ...defaults, ...args }
}
