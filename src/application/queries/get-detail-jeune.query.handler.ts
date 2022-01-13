import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
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
    private jeunesRepository: Jeune.Repository,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer
  ) {
    super('GetDetailJeuneQueryHandler')
  }

  async handle(
    query: GetDetailJeuneQuery
  ): Promise<DetailJeuneQueryModel | undefined> {
    return this.jeunesRepository.getQueryModelById(query.idJeune)
  }

  async authorize(
    query: GetDetailJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerForJeuneAuthorizer.authorize(
      query.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
