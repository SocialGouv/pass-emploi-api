import { OffresEmploiQueryModel } from '../../../application/queries/query-models/offres-emploi.query-model'
import { Offre } from '../../../domain/offre/offre'
import { FavoriOffreEmploiSqlModel } from '../../sequelize/models/favori-offre-emploi.sql-model'
import { OffreEmploiDto } from '../dto/pole-emploi.dto'

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
        origine: mapOrigine(offre)
      }
    })
  }
}

export function toFavoriOffreEmploi(
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
    titre: favoriOffreEmploiSqlModel.titre,
    origine: favoriOffreEmploiSqlModel.origineNom
      ? {
          nom: favoriOffreEmploiSqlModel.origineNom,
          logo: favoriOffreEmploiSqlModel.origineLogoUrl ?? undefined
        }
      : undefined
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

function capitalize(input: string): string {
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

export function mapOrigine(
  offreEmploiDto: OffreEmploiDto
): { nom: string; logo?: string } | undefined {
  let origine: { nom: string; logo?: string } | undefined
  if (offreEmploiDto.origineOffre.origine === '1') {
    origine = { nom: 'France Travail' }
  } else if (
    offreEmploiDto.origineOffre.partenaires?.length &&
    offreEmploiDto.origineOffre.partenaires[0]?.logo &&
    offreEmploiDto.origineOffre.partenaires[0]?.nom
  ) {
    origine = {
      nom: capitalize(offreEmploiDto.origineOffre.partenaires[0].nom),
      logo: offreEmploiDto.origineOffre.partenaires[0].logo
    }
  }
  return origine
}
