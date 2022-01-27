import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'

export interface GetConseillerByEmailQuery extends Query {
  emailConseiller: string
  structure: Core.Structure
}

@Injectable()
export class GetConseillerByEmailQueryHandler extends QueryHandler<
  GetConseillerByEmailQuery,
  Result<DetailConseillerQueryModel>
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetConseillerByEmailQueryHandler')
  }

  async handle(
    query: GetConseillerByEmailQuery
  ): Promise<Result<DetailConseillerQueryModel>> {
    return this.conseillersRepository.getQueryModelByEmailAndStructure(
      query.emailConseiller,
      query.structure
    )
  }

  async authorize(
    _query: GetConseillerByEmailQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    this.conseillerAuthorizer.authorizeSuperviseur(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
