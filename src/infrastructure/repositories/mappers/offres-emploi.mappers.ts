import {
  OffresEmploiQueryModel,
  OffreEmploiQueryModel,
  OffreEmploiListItem,
  Localisation
} from '../../../domain/offres-emploi'
import { FavoriOffreEmploiSqlModel } from '../../sequelize/models/favori-offre-emploi.sql-model'
import {
  OffresEmploiDto,
  OffreEmploiDto
} from '../offre-emploi-http-sql.repository'

export function toOffresEmploiQueryModel(
  page: number,
  limit: number,
  offresEmploiDto: OffresEmploiDto
): OffresEmploiQueryModel {
  return {
    pagination: {
      page,
      limit
    },
    results: offresEmploiDto?.resultats
      ? offresEmploiDto.resultats.map((result: OffreEmploiDto) => {
          return {
            id: result.id,
            titre: result.intitule,
            typeContrat: result.typeContrat,
            alternance: result.alternance,
            duree: result.dureeTravailLibelleConverti,
            nomEntreprise: result.entreprise?.nom,
            localisation: result.lieuTravail
              ? {
                  nom: result.lieuTravail.libelle,
                  codePostal: result.lieuTravail.codePostal,
                  commune: result.lieuTravail.commune
                }
              : undefined
          }
        })
      : []
  }
}

export function toOffreEmploiQueryModel(
  offreEmploiDto: OffreEmploiDto
): OffreEmploiQueryModel {
  return {
    id: offreEmploiDto.id,
    urlRedirectPourPostulation:
      offreEmploiDto.contact?.urlPostulation ||
      offreEmploiDto.origineOffre?.urlOrigine,
    data: offreEmploiDto
  }
}

export function toFavoriOffreEmploiSqlModel(
  idJeune: string,
  offreEmploi: OffreEmploiListItem
): Partial<FavoriOffreEmploiSqlModel> {
  return {
    idJeune: idJeune,
    idOffre: offreEmploi.id,
    titre: offreEmploi.titre,
    typeContrat: offreEmploi.typeContrat,
    nomEntreprise: offreEmploi.nomEntreprise,
    duree: offreEmploi.duree,
    nomLocalisation: offreEmploi.localisation?.nom || null,
    codePostalLocalisation: offreEmploi.localisation?.codePostal || null,
    communeLocalisation: offreEmploi.localisation?.commune || null,
    isAlternance:
      offreEmploi.alternance !== null ? offreEmploi.alternance : null
  }
}

export function toOffreEmploiListItem(
  favoriOffreEmploiSqlModel: FavoriOffreEmploiSqlModel
): OffreEmploiListItem {
  return {
    id: favoriOffreEmploiSqlModel.idOffre,
    alternance:
      favoriOffreEmploiSqlModel.isAlternance === null
        ? undefined
        : favoriOffreEmploiSqlModel.isAlternance,
    duree: favoriOffreEmploiSqlModel.duree,
    localisation: buildLocalisation(favoriOffreEmploiSqlModel),
    typeContrat: favoriOffreEmploiSqlModel.typeContrat,
    nomEntreprise: favoriOffreEmploiSqlModel.nomEntreprise,
    titre: favoriOffreEmploiSqlModel.titre
  }
}

export function buildLocalisation(
  favoriOffreEmploiSqlModel: FavoriOffreEmploiSqlModel
): Localisation | undefined {
  if (
    favoriOffreEmploiSqlModel.nomLocalisation &&
    favoriOffreEmploiSqlModel.codePostalLocalisation &&
    favoriOffreEmploiSqlModel.communeLocalisation
  ) {
    return {
      nom: favoriOffreEmploiSqlModel.nomLocalisation,
      codePostal: favoriOffreEmploiSqlModel.codePostalLocalisation,
      commune: favoriOffreEmploiSqlModel.communeLocalisation
    }
  }
  return undefined
}
