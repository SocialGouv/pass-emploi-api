import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'

export interface GetDetailConseillerQuery extends Query {
  idConseiller: Conseiller.Id
}

@Injectable()
export class GetDetailConseillerQueryHandler extends QueryHandler<
  GetDetailConseillerQuery,
  DetailConseillerQueryModel | undefined
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository
  ) {
    super()
  }

  handle(
    query: GetDetailConseillerQuery
  ): Promise<DetailConseillerQueryModel | undefined> {
    return this.conseillersRepository.getQueryModelById(query.idConseiller)
  }
  async authorize(query: GetDetailConseillerQuery): Promise<void> {
    if (query) {
    }
  }
}
