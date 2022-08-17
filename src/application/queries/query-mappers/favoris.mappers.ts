import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavorisQueryModel } from '../query-models/favoris.query-model'
import { Favori } from '../../../domain/favori'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'

export function fromOffreEmploiSqlToFavorisQueryModel(
  offre: FavoriOffreEmploiSqlModel
): FavorisQueryModel {
  return {
    idOffre: offre.idOffre,
    titre: offre.titre,
    type: offre.isAlternance
      ? Favori.TypeOffre.ALTERNANCE
      : Favori.TypeOffre.EMPLOI,
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
    type: Favori.TypeOffre.IMMERSION,
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
    type: Favori.TypeOffre.SERVICE_CIVIQUE,
    organisation: offre.organisation ?? undefined,
    localisation: offre.ville ?? undefined
  }
}
