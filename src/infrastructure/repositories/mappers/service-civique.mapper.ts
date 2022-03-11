import {
  DetailOffreEngagementQueryModel,
  OffreEngagementQueryModel
} from '../../../application/queries/query-models/service-civique.query-models'
import { Core } from '../../../domain/core'
import { FavoriOffreEngagementSqlModel } from '../../sequelize/models/favori-offre-engagement.sql-model'
import {
  EngagementDto,
  OffreEngagementDto
} from '../offre-engagement-http.repository'

export function toServiceCiviqueQueryModel(
  servicesCiviqueDto: EngagementDto
): OffreEngagementQueryModel[] {
  return servicesCiviqueDto.hits.map(engagementDto => ({
    id: engagementDto.id,
    titre: engagementDto.title,
    dateDeDebut: engagementDto.startAt,
    domaine: engagementDto.domain,
    ville: engagementDto.city,
    organisation: engagementDto.organizationName
  }))
}

export function toDetailOffreEngagementQueryModel(
  serviceCiviqueDto: OffreEngagementDto
): DetailOffreEngagementQueryModel {
  return {
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
    descriptionOrganisation: serviceCiviqueDto.organizationDescription
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
): OffreEngagementQueryModel {
  return {
    id: favoriOffreEngagementSqlModel.idOffre,
    domaine: favoriOffreEngagementSqlModel.domaine,
    ville: favoriOffreEngagementSqlModel.ville ?? undefined,
    titre: favoriOffreEngagementSqlModel.titre,
    organisation: favoriOffreEngagementSqlModel.organisation ?? undefined,
    dateDeDebut: favoriOffreEngagementSqlModel.dateDeDebut ?? undefined
  }
}
