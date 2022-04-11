import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
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
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetDetailJeuneQueryHandler')
  }

  async handle(
    query: GetDetailJeuneQuery
  ): Promise<DetailJeuneQueryModel | undefined> {
    return this.jeunesRepository.getDetailJeuneQueryModelById(query.idJeune)
  }

  async authorize(
    query: GetDetailJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
