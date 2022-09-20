import { FavoriOffreEmploiSqlModel } from '../../sequelize/models/favori-offre-emploi.sql-model'
import { OffreEmploiDto, OffresEmploiDto } from '../dto/pole-emploi.dto'
import {
  FavoriOffreEmploiIdQueryModel,
  OffresEmploiQueryModel
} from '../../../application/queries/query-models/offres-emploi.query-model'
import { Offre } from '../../../domain/offre/offre'

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

export function toFavoriOffreEmploiSqlModel(
  idJeune: string,
  offreEmploi: Offre.Favori.Emploi
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
    isAlternance: offreEmploi.alternance
  }
}

export function toOffreEmploi(
  favoriOffreEmploiSqlModel: FavoriOffreEmploiSqlModel
): Offre.Favori.Emploi {
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
): Offre.Favori.Emploi.Localisation {
  return {
    nom: favoriOffreEmploiSqlModel.nomLocalisation || '',
    codePostal: favoriOffreEmploiSqlModel.codePostalLocalisation || '',
    commune: favoriOffreEmploiSqlModel.communeLocalisation || ''
  }
}

export function fromSqlToFavorisOffresEmploiIdsQueryModels(
  favorisIdsSql: FavoriOffreEmploiSqlModel[]
): FavoriOffreEmploiIdQueryModel[] {
  return favorisIdsSql.map(favori => {
    return { id: favori.idOffre }
  })
}

export function toPoleEmploiContrat(
  contratsList: Offre.Emploi.Contrat[]
): string[] {
  const contratPoleEmploi = {
    CDI: 'CDI,DIN',
    'CDD-interim-saisonnier': 'CDD,MIS,SAI,DDI',
    autre: 'CCE,FRA,LIB,REP,TTI'
  }

  return contratsList.map(
    (contrat: Offre.Emploi.Contrat) => contratPoleEmploi[contrat]
  )
}
