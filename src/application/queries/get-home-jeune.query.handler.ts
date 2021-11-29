import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { JeuneHomeQueryModel } from './query-models/jeunes.query-models'

export interface GetHomeJeune extends Query {
  idJeune: string
}

@Injectable()
export class GetHomeJeuneHandler
  implements QueryHandler<GetHomeJeune, JeuneHomeQueryModel>
{
  constructor(
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository
  ) {}

  async execute(query: GetHomeJeune): Promise<JeuneHomeQueryModel> {
    return this.jeuneRepository.getHomeQueryModel(query.idJeune)
  }
}
