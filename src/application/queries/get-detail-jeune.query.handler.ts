import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetDetailJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetDetailJeuneQueryHandler extends QueryHandler<
  GetDetailJeuneQuery,
  DetailJeuneQueryModel | undefined
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeunesRepository: Jeune.Repository
  ) {
    super()
  }

  async handle(
    query: GetDetailJeuneQuery
  ): Promise<DetailJeuneQueryModel | undefined> {
    return this.jeunesRepository.getQueryModelById(query.idJeune)
  }
  async authorize(query: GetDetailJeuneQuery): Promise<void> {
    if (query) {
    }
  }
}
