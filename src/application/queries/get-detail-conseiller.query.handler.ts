import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'

export interface GetDetailConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetDetailConseillerQueryHandler extends QueryHandler<
  GetDetailConseillerQuery,
  DetailConseillerQueryModel | undefined
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetDetailConseillerQueryHandler')
  }

  async handle(
    query: GetDetailConseillerQuery
  ): Promise<DetailConseillerQueryModel | undefined> {
    return this.conseillersRepository.getQueryModelById(query.idConseiller)
  }
  async authorize(
    query: GetDetailConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
