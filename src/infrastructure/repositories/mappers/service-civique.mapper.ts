import { Core } from '../../../domain/core'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import {
  EngagementDto,
  OffreEngagementDto
} from '../offre-engagement-http.repository'
import { OffreEngagement } from '../../../domain/offre-engagement'

export function toOffresEngagement(
  servicesCiviqueDto: EngagementDto
): OffreEngagement[] {
  return servicesCiviqueDto.hits.map(toOffreEngagement)
}

export function toOffreEngagement(
  serviceCiviqueDto: OffreEngagementDto
): OffreEngagement {
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

export function fromSqlToOffreEngagement(
  favoriOffreEngagementSqlModel: FavoriOffreEngagementSqlModel
): OffreEngagement {
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
): OffreEngagement.Localisation | undefined {
  if (serviceCiviqueDto.location) {
    return {
      latitude: serviceCiviqueDto.location.lat,
      longitude: serviceCiviqueDto.location.lon
    }
  }
  return undefined
}
