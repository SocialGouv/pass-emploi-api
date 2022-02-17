import { ServicesCiviqueDto } from '../service-civique-http.repository'
import { ServiceCiviqueQueryModel } from '../../../application/queries/query-models/service-civique.query-models'

export function toServiceCiviqueQueryModel(
  servicesCiviqueDto: ServicesCiviqueDto
): ServiceCiviqueQueryModel[] {
  return servicesCiviqueDto.hits.map(serviceCiviqueDto => ({
    id: serviceCiviqueDto.id,
    titre: serviceCiviqueDto.title,
    dateDeDebut: serviceCiviqueDto.startAt,
    domaine: serviceCiviqueDto.domain,
    ville: serviceCiviqueDto.city
  }))
}
