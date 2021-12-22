import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'
import { DetailOffreImmersionQueryModel } from './query-models/offres-immersion.query-models'
import { Result } from '../../building-blocks/types/result'

export interface GetDetailOffreImmersionQuery extends Query {
  idOffreImmersion: string
}

@Injectable()
export class GetDetailOffreImmersionQueryHandler extends QueryHandler<
  GetDetailOffreImmersionQuery,
  Result<DetailOffreImmersionQueryModel>
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository
  ) {
    super()
  }

  async handle(
    query: GetDetailOffreImmersionQuery
  ): Promise<Result<DetailOffreImmersionQueryModel>> {
    return this.offresImmersionRepository.get(query.idOffreImmersion)
  }
  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetDetailOffreImmersionQuery
  ): Promise<void> {
    return
  }
}
