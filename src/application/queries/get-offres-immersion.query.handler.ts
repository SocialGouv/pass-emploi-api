import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'
import { OffreImmersionQueryModel } from './query-models/offres-immersion.query-models'

export interface GetOffresImmersionQuery extends Query {
  rome: string
  lat: number
  lon: number
}

@Injectable()
export class GetOffresImmersionQueryHandler extends QueryHandler<
  GetOffresImmersionQuery,
  OffreImmersionQueryModel[]
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository
  ) {
    super()
  }

  async handle(
    query: GetOffresImmersionQuery
  ): Promise<OffreImmersionQueryModel[]> {
    return this.offresImmersionRepository.findAll(
      query.rome,
      query.lat,
      query.lon
    )
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetOffresImmersionQuery
  ): Promise<void> {
    return
  }
}
