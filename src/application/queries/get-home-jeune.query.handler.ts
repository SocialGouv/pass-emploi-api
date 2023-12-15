import { Inject, Injectable } from '@nestjs/common'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { JeuneHomeQueryModel } from './query-models/home-jeune.query-model'

export interface GetHomeJeune extends Query {
  idJeune: string
}

@Injectable()
export class GetHomeJeuneHandler extends QueryHandler<
  GetHomeJeune,
  JeuneHomeQueryModel
> {
  constructor(
    @Inject(JeuneRepositoryToken) private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetHomeJeuneHandler')
  }

  async handle(query: GetHomeJeune): Promise<JeuneHomeQueryModel> {
    return this.jeuneRepository.getHomeQueryModel(query.idJeune)
  }
  async authorize(
    query: GetHomeJeune,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
