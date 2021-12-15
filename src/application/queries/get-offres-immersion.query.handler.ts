import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'
import { OffresImmersionQueryModel } from './query-models/offres-immersion.query-models'

export interface GetOffresImmersionQuery extends Query {
  metier?: string
  ville?: string
}

@Injectable()
export class GetOffresImmersionQueryHandler extends QueryHandler<
  GetOffresImmersionQuery,
  OffresImmersionQueryModel
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository
  ) {
    super()
  }

  async handle(
    query: GetOffresImmersionQuery
  ): Promise<OffresImmersionQueryModel> {
    return this.offresImmersionRepository.findAll(query.metier, query.ville)
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetOffresImmersionQuery
  ): Promise<void> {
    return
  }
}
