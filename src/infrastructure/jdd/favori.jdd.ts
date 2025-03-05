import { AsSql } from '../sequelize/types'
import { FavoriOffreEmploiSqlModel } from '../sequelize/models/favori-offre-emploi.sql-model'

export function unFavoriOffreEmploiJdd(
  args: Partial<AsSql<FavoriOffreEmploiSqlModel>> = {}
): AsSql<FavoriOffreEmploiSqlModel> {
  const defaults: AsSql<FavoriOffreEmploiSqlModel> = {
    id: 1,
    idJeune: '1',
    idOffre: 'un-id-offre',
    titre: 'Barbier',
    typeContrat: 'CDI',
    nomEntreprise: 'Barber Shop',
    duree: 'ad vitam',
    isAlternance: false,
    nomLocalisation: 'Nantes',
    codePostalLocalisation: '44300',
    communeLocalisation: '44000',
    dateCreation: new Date(),
    dateCandidature: null,
    origineLogoUrl: null,
    origineNom: null
  }

  return { ...defaults, ...args }
}
