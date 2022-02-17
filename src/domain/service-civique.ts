import { Result } from '../building-blocks/types/result'
import { ServiceCiviqueQueryModel } from '../application/queries/query-models/service-civique.query-models'
import { DateTime } from 'luxon'

export const ServiceCiviqueRepositoryToken = 'ServiceCivique.Repository'

export namespace ServiceCivique {
  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<ServiceCiviqueQueryModel[]>>
  }

  export interface Criteres {
    page: number
    limit: number
    lat?: number
    lon?: number
    distance?: number
    dateDeDebutMinimum?: DateTime
    dateDeDebutMaximum?: DateTime
    domaine?: string
  }
}
