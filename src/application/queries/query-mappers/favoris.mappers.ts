import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavorisQueryModel } from '../query-models/favoris.query-model'

export function fromOffreEmploiSqlToFavorisQueryModel(
  offre: FavoriOffreEmploiSqlModel
): FavorisQueryModel {
  return {
    idOffre: offre.idOffre,
    titre: offre.titre,
    entreprise: offre.nomEntreprise,
    localisation: offre.nomLocalisation ?? undefined
  }
}
