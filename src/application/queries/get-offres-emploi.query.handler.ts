import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresEmploi,
  OffresEmploiQueryModel,
  OffresEmploiRepositoryToken
} from '../../domain/offres-emploi'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50

export interface GetOffresEmploiQuery extends Query {
  page?: number
  limit?: number
  query?: string
  departement?: string
  alternance?: boolean
}

@Injectable()
export class GetOffresEmploiQueryHandler
  implements QueryHandler<GetOffresEmploiQuery, OffresEmploiQueryModel>
{
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository
  ) {}

  async execute(query: GetOffresEmploiQuery): Promise<OffresEmploiQueryModel> {
    return this.offresEmploiRepository.findAll(
      query.page || DEFAULT_PAGE,
      query.limit || DEFAULT_LIMIT,
      query.query,
      query.departement,
      query.alternance
    )
  }
}
