import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetJeunesByConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetJeunesByConseillerQueryHandler extends QueryHandler<
  GetJeunesByConseillerQuery,
  DetailJeuneQueryModel[]
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetJeunesByConseillerQueryHandler')
  }

  handle(query: GetJeunesByConseillerQuery): Promise<DetailJeuneQueryModel[]> {
    return this.jeunesRepository.getAllQueryModelsByConseiller(
      query.idConseiller
    )
  }
  async authorize(
    query: GetJeunesByConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
