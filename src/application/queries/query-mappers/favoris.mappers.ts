import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavorisQueryModel } from '../query-models/favoris.query-model'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { Offre } from '../../../domain/offre/offre'
import { DateService } from '../../../utils/date-service'

export function fromOffreEmploiSqlToFavorisQueryModel(
  offre: FavoriOffreEmploiSqlModel
): FavorisQueryModel {
  const tags = [offre.typeContrat]
  if (offre.duree) {
    tags.push(offre.duree)
  }
  return {
    idOffre: offre.idOffre,
    titre: offre.titre,
    type: offre.isAlternance
      ? Offre.Favori.Type.ALTERNANCE
      : Offre.Favori.Type.EMPLOI,
    organisation: offre.nomEntreprise ?? undefined,
    localisation: offre.nomLocalisation ?? undefined,
    dateCreation: offre.dateCreation
      ? DateService.fromJSDateToISOString(offre.dateCreation)
      : undefined,
    dateCandidature: offre.dateCandidature
      ? DateService.fromJSDateToISOString(offre.dateCandidature)
      : undefined,
    tags,
    origine: offre.origineNom
      ? {
          nom: offre.origineNom,
          logo: offre.origineLogoUrl ?? undefined
        }
      : undefined
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
    localisation: offre.ville,
    dateCreation: offre.dateCreation
      ? DateService.fromJSDateToISOString(offre.dateCreation)
      : undefined,
    dateCandidature: offre.dateCandidature
      ? DateService.fromJSDateToISOString(offre.dateCandidature)
      : undefined,
    tags: [offre.secteurActivite]
  }
}

export function fromOffreServiceCiviqueSqlToFavorisQueryModel(
  offre: FavoriOffreEngagementSqlModel
): FavorisQueryModel {
  const tags = [offre.domaine]
  if (offre.dateDeDebut) {
    tags.push(offre.dateDeDebut)
  }
  return {
    idOffre: offre.idOffre,
    titre: offre.titre,
    type: Offre.Favori.Type.SERVICE_CIVIQUE,
    organisation: offre.organisation ?? undefined,
    localisation: offre.ville ?? undefined,
    dateCreation: offre.dateCreation
      ? DateService.fromJSDateToISOString(offre.dateCreation)
      : undefined,
    dateCandidature: offre.dateCandidature
      ? DateService.fromJSDateToISOString(offre.dateCandidature)
      : undefined,
    tags
  }
}
