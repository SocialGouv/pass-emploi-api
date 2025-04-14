import { AsSql } from '../sequelize/types'
import { RechercheDto } from '../sequelize/models/recherche.sql-model'
import { v4 as uuidV4 } from 'uuid'
import { Recherche } from '../../domain/offre/recherche/recherche'

export const uneRechercheJdd = (
  args: Partial<RechercheDto> = {}
): Omit<AsSql<RechercheDto>, 'geometrie'> => {
  const defaults = {
    id: uuidV4(),
    idJeune: 'abcd',
    titre: 'Coiffeur barbier / Coiffeuse barbière - NANTES (44)',
    metier: 'Coiffeur barbier / Coiffeuse barbière',
    type: Recherche.Type.OFFRES_EMPLOI,
    localisation: 'NANTES (44)',
    criteres: { lat: 47.239367, lon: -1.555335, q: 'D1202' },
    dateCreation: new Date('2022-11-09T18:00:33.286000+00:00'),
    dateDerniereRecherche: new Date('2022-11-09T18:00:33.286000+00:00'),
    etatDerniereRecherche: Recherche.Etat.SUCCES
  }
  return { ...defaults, ...args }
}
