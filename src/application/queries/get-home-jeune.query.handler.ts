import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
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
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super()
  }

  async handle(query: GetHomeJeune): Promise<JeuneHomeQueryModel> {
    return this.jeuneRepository.getHomeQueryModel(query.idJeune)
  }
  async authorize(
    query: GetHomeJeune,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
