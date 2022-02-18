import { OffreEngagementQueryModel } from '../../../application/queries/query-models/service-civique.query-models'
import { EngagementDto } from '../offre-engagement-http.repository'

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
