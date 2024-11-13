import { FavoriOffreEmploiSqlModel } from '../../sequelize/models/favori-offre-emploi.sql-model'
import { OffreEmploiDto } from '../dto/pole-emploi.dto'
import {
  FavoriOffreEmploiIdQueryModel,
  OffresEmploiQueryModel
} from '../../../application/queries/query-models/offres-emploi.query-model'
import { Offre } from '../../../domain/offre/offre'

export function toOffresEmploiQueryModel(
  page: number,
  limit: number,
  total: number,
  offresEmploiDto: OffreEmploiDto[]
): OffresEmploiQueryModel {
  return {
    pagination: {
      page,
      limit,
      total
    },
    results: offresEmploiDto.map((offre: OffreEmploiDto) => {
      let origine: { nom: string; logo?: string } | undefined
      if (offre.origineOffre.origine === '1') {
        origine = { nom: 'France Travail' }
      } else if (
        offre.origineOffre.partenaires?.length &&
        offre.origineOffre.partenaires[0]?.logo &&
        offre.origineOffre.partenaires[0]?.nom
      ) {
        origine = {
          nom: capitalize(offre.origineOffre.partenaires[0].nom),
          logo: offre.origineOffre.partenaires[0].logo
        }
      }
      return {
        id: offre.id,
        titre: offre.intitule,
        typeContrat: offre.typeContrat,
        alternance: offre.alternance,
        duree: offre.dureeTravailLibelleConverti,
        nomEntreprise: offre.entreprise?.nom,
        localisation: offre.lieuTravail
          ? {
              nom: offre.lieuTravail.libelle,
              codePostal: offre.lieuTravail.codePostal,
              commune: offre.lieuTravail.commune
            }
          : undefined,
        origine
      }
    })
  }
}

export function toFavoriOffreEmploiSqlModel(
  idJeune: string,
  offreEmploi: Offre.Favori.Emploi,
  dateCreation: Date
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
    isAlternance: offreEmploi.alternance,
    dateCreation
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
    duree: favoriOffreEmploiSqlModel.duree ?? undefined,
    localisation: buildLocalisation(favoriOffreEmploiSqlModel),
    typeContrat: favoriOffreEmploiSqlModel.typeContrat,
    nomEntreprise: favoriOffreEmploiSqlModel.nomEntreprise ?? undefined,
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

export function capitalize(input: string): string {
  return input
    .trim()
    .replace('_', ' ')
    .split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
    .trim()
}
