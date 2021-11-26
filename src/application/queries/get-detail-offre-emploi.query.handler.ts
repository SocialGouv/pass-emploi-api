import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import { OffreEmploiQueryModel } from './query-models/offres-emploi.query-models'

export interface GetDetailOffreEmploiQuery extends Query {
  idOffreEmploi: string
}

@Injectable()
export class GetDetailOffreEmploiQueryHandler
  implements QueryHandler<GetDetailOffreEmploiQuery, OffreEmploiQueryModel>
{
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository
  ) {}

  async execute(
    query: GetDetailOffreEmploiQuery
  ): Promise<OffreEmploiQueryModel | undefined> {
    return this.offresEmploiRepository.getOffreEmploiQueryModelById(
      query.idOffreEmploi
    )
  }
}
