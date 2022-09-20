import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavorisQueryModel } from '../query-models/favoris.query-model'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { Offre } from '../../../domain/offre/offre'

export function fromOffreEmploiSqlToFavorisQueryModel(
  offre: FavoriOffreEmploiSqlModel
): FavorisQueryModel {
  return {
    idOffre: offre.idOffre,
    titre: offre.titre,
    type: offre.isAlternance
      ? Offre.Favori.Type.ALTERNANCE
      : Offre.Favori.Type.EMPLOI,
    organisation: offre.nomEntreprise,
    localisation: offre.nomLocalisation ?? undefined
  }
}

export function fromOffreImmersionSqlToFavorisQueryModel(
  offre: FavoriOffreImmersionSqlModel
): FavorisQueryModel {
  return {
    idOffre: offre.idOffre,
    titre: offre.metier,
    type: Offre.Favori.Type.IMMERSION,
    organisation: offre.nomEtablissement,
    localisation: offre.ville
  }
}

export function fromOffreServiceCiviqueSqlToFavorisQueryModel(
  offre: FavoriOffreEngagementSqlModel
): FavorisQueryModel {
  return {
    idOffre: offre.idOffre,
    titre: offre.titre,
    type: Offre.Favori.Type.SERVICE_CIVIQUE,
    organisation: offre.organisation ?? undefined,
    localisation: offre.ville ?? undefined
  }
}
