import { Recherche } from 'src/domain/offre/recherche/recherche'
import { RechercheDto } from 'src/infrastructure/sequelize/models/recherche.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function uneRechercheDto(
  args: Partial<AsSql<RechercheDto>> = {}
): AsSql<RechercheDto> {
  const defaults: AsSql<RechercheDto> = {
    id: 'une recherche',
    idJeune: '1',
    type: Recherche.Type.OFFRES_EMPLOI,
    titre: 'Boulanger en alternance',
    metier: 'Boucher',
    localisation: 'Paris',
    criteres: null,
    dateCreation: new Date('2023-03-03T10:00:00.000Z'),
    dateDerniereRecherche: new Date('2023-03-03T10:00:00.000Z'),
    etatDerniereRecherche: Recherche.Etat.SUCCES,
    geometrie: {
      type: 'Polygon',
      coordinates: [
        [
          [100.0, 0.0],
          [101.0, 0.0],
          [101.0, 1.0],
          [100.0, 1.0],
          [100.0, 0.0]
        ]
      ]
    }
  }

  return { ...defaults, ...args }
}
