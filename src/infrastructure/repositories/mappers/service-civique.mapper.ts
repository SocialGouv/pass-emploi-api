import { Core } from '../../../domain/core'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import {
  EngagementDto,
  OffreEngagementDto
} from '../offre-service-civique-http.repository.db'
import { OffreServiceCivique } from '../../../domain/offre-service-civique'

export function toOffresServicesCivique(
  servicesCiviqueDto: EngagementDto
): OffreServiceCivique[] {
  return servicesCiviqueDto.hits.map(toOffreEngagement)
}

export function toOffreEngagement(
  serviceCiviqueDto: OffreEngagementDto
): OffreServiceCivique {
  return {
    id: serviceCiviqueDto.id,
    titre: serviceCiviqueDto.title,
    dateDeDebut: serviceCiviqueDto.startAt,
    dateDeFin: serviceCiviqueDto.endAt,
    domaine: serviceCiviqueDto.domain,
    ville: serviceCiviqueDto.city,
    organisation: serviceCiviqueDto.organizationName,
    lienAnnonce: serviceCiviqueDto.applicationUrl,
    urlOrganisation: serviceCiviqueDto.organizationUrl,
    adresseMission: serviceCiviqueDto.adresse,
    adresseOrganisation: serviceCiviqueDto.organizationFullAddress,
    codeDepartement: serviceCiviqueDto.departmentCode,
    description: serviceCiviqueDto.description,
    codePostal: serviceCiviqueDto.postalCode,
    descriptionOrganisation: serviceCiviqueDto.organizationDescription,
    localisation: buildLocalisation(serviceCiviqueDto)
  }
}

export function fromSqlToIds(
  favoriOffreEngagementSqlModels: FavoriOffreEngagementSqlModel[]
): Core.Id[] {
  return favoriOffreEngagementSqlModels.map(favori => {
    return { id: favori.idOffre }
  })
}

export function fromSqlToOffreServiceCivique(
  favoriOffreEngagementSqlModel: FavoriOffreEngagementSqlModel
): OffreServiceCivique {
  return {
    id: favoriOffreEngagementSqlModel.idOffre,
    domaine: favoriOffreEngagementSqlModel.domaine,
    ville: favoriOffreEngagementSqlModel.ville ?? undefined,
    titre: favoriOffreEngagementSqlModel.titre,
    organisation: favoriOffreEngagementSqlModel.organisation ?? undefined,
    dateDeDebut: favoriOffreEngagementSqlModel.dateDeDebut ?? undefined
  }
}

function buildLocalisation(
  serviceCiviqueDto: OffreEngagementDto
): Core.Localisation | undefined {
  if (serviceCiviqueDto.location) {
    return {
      latitude: serviceCiviqueDto.location.lat,
      longitude: serviceCiviqueDto.location.lon
    }
  }
  return undefined
}
