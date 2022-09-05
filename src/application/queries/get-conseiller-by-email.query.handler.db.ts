import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { fromSqlToDetailConseillerQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-model'

export interface GetConseillerByEmailQuery extends Query {
  emailConseiller: string
  structureUtilisateur: Core.Structure
}

@Injectable()
export class GetConseillerByEmailQueryHandler extends QueryHandler<
  GetConseillerByEmailQuery,
  Result<DetailConseillerQueryModel>
> {
  constructor(private readonly conseillerAuthorizer: ConseillerAuthorizer) {
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

    const jeuneARecuperer = await JeuneSqlModel.findOne({
      where: { idConseillerInitial: conseillerSqlModel.id },
      attributes: ['id']
    })

    return success(
      fromSqlToDetailConseillerQueryModel(
        conseillerSqlModel,
        Boolean(jeuneARecuperer)
      )
    )
  }

  async authorize(
    _query: GetConseillerByEmailQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorizeSuperviseur(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
