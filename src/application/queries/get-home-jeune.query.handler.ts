import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Jeune,
  JeuneHomeQueryModel,
  JeunesRepositoryToken
} from '../../domain/jeune'

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
