import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { JeuneHomeQueryModel } from './query-models/home-jeune.query-models'

export interface GetHomeJeune extends Query {
  idJeune: string
}

@Injectable()
export class GetHomeJeuneHandler extends QueryHandler<
  GetHomeJeune,
  JeuneHomeQueryModel
> {
  constructor(
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository
  ) {
    super()
  }

  async handle(query: GetHomeJeune): Promise<JeuneHomeQueryModel> {
    return this.jeuneRepository.getHomeQueryModel(query.idJeune)
  }
  async authorize(query: GetHomeJeune): Promise<void> {
    if (query) {
    }
  }
}
