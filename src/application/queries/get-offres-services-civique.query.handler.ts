import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { FindAllOffresServicesCiviqueQueryGetter } from './query-getters/find-all-offres-services-civique.query.getter'
import { ServicesCiviqueQueryModel } from './query-models/service-civique.query-model'

export interface GetServicesCiviqueQuery extends Query {
  page?: number
  limit?: number
  lat?: number
  lon?: number
  distance?: number
  dateDeDebutMinimum?: string
  dateDeDebutMaximum?: string
  domaine?: string
  dateDeCreationMinimum?: string
}

@Injectable()
export class GetOffresServicesCiviqueQueryHandler extends QueryHandler<
  GetServicesCiviqueQuery,
  Result<ServicesCiviqueQueryModel>
> {
  constructor(
    private findAllOffresServicesCiviqueQueryGetter: FindAllOffresServicesCiviqueQueryGetter,
    private evenementService: EvenementService
  ) {
    super('GetServicesCiviqueQueryHandler')
  }

  async handle(
    query: GetServicesCiviqueQuery
  ): Promise<Result<ServicesCiviqueQueryModel>> {
    const result = await this.findAllOffresServicesCiviqueQueryGetter.handle(
      query
    )

    if (isFailure(result)) {
      return result
    }

    const { total, results } = result.data
    return success({ pagination: { total }, results })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_RECHERCHEE,
      utilisateur
    )
  }
}
