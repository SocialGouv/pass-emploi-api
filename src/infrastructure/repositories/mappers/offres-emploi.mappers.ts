import {
  FavoriIdQueryModel,
  OffreEmploiQueryModel,
  OffreEmploiResumeQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import {
  OffreEmploi,
  Localisation,
  ContratPoleEmploi
} from '../../../domain/offre-emploi'
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
  offreEmploi: OffreEmploi
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

export function toOffreEmploi(
  favoriOffreEmploiSqlModel: FavoriOffreEmploiSqlModel
): OffreEmploi {
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

export function fromSqlToFavorisIdsQueryModels(
  favorisIdsSql: FavoriOffreEmploiSqlModel[]
): FavoriIdQueryModel[] {
  return favorisIdsSql.map(favori => {
    return { id: favori.idOffre }
  })
}

export function fromSqlToFavorisQueryModels(
  favorisSql: FavoriOffreEmploiSqlModel[]
): OffreEmploiResumeQueryModel[] {
  return favorisSql.map(favoriSql => {
    return {
      id: favoriSql.idOffre,
      alternance:
        favoriSql.isAlternance === null ? undefined : favoriSql.isAlternance,
      duree: favoriSql.duree,
      localisation: buildLocalisation(favoriSql),
      typeContrat: favoriSql.typeContrat,
      nomEntreprise: favoriSql.nomEntreprise,
      titre: favoriSql.titre
    }
  })
}

export function toPoleEmploiContrat(contratsList: string[]): string[] {
  const contratPoleEmploi = new ContratPoleEmploi()
  const poleEmploiContratsList = []
  for (const contrat of contratsList) {
    switch (contrat) {
      case 'CDI':
        poleEmploiContratsList.push(...contratPoleEmploi.CDI)
        break
      case 'CDD':
        poleEmploiContratsList.push(...contratPoleEmploi.CDD)
        break
      case 'interim':
        poleEmploiContratsList.push(...contratPoleEmploi.interim)
        break
      case 'saisonnier':
        poleEmploiContratsList.push(...contratPoleEmploi.saisonnier)
        break
      case 'autre':
        poleEmploiContratsList.push(...contratPoleEmploi.autre)
        break
    }
  }
  return poleEmploiContratsList
}
