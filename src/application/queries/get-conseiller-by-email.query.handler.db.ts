import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { fromSqlToDetailConseillerQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'

export interface GetConseillerByEmailQuery extends Query {
  emailConseiller: string
  structureUtilisateur: Core.Structure
}

@Injectable()
export class GetConseillerByEmailQueryHandler extends QueryHandler<
  GetConseillerByEmailQuery,
  Result<DetailConseillerQueryModel>
> {
  constructor(private conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetConseillerByEmailQueryHandler')
  }

  async handle(
    query: GetConseillerByEmailQuery
  ): Promise<Result<DetailConseillerQueryModel>> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      include: [AgenceSqlModel],
      where: {
        email: query.emailConseiller,
        structure: query.structureUtilisateur
      }
    })
    if (!conseillerSqlModel) {
      return failure(new NonTrouveError('Conseiller', query.emailConseiller))
    }

    return success(fromSqlToDetailConseillerQueryModel(conseillerSqlModel))
  }

  async authorize(
    _query: GetConseillerByEmailQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    return this.conseillerAuthorizer.authorizeSuperviseur(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
