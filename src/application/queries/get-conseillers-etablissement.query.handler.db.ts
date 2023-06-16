import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { fromSqlToDetailConseillerQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-model'

export interface GetConseillersEtablissementQuery extends Query {
  idAgence: string
}

@Injectable()
export class GetConseillersEtablissementQueryHandler extends QueryHandler<
  GetConseillersEtablissementQuery,
  Result<DetailConseillerQueryModel[]>
> {
  constructor(private readonly conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetConseillersEtablissementQueryHandler')
  }

  async handle(
    query: GetConseillersEtablissementQuery
  ): Promise<Result<DetailConseillerQueryModel[]>> {
    const conseillersSqlModel = await ConseillerSqlModel.findAll({
      include: [AgenceSqlModel],
      where: {
        idAgence: query.idAgence
      }
    })

    return success(
      conseillersSqlModel.map(conseiller =>
        fromSqlToDetailConseillerQueryModel(conseiller, false)
      )
    )
  }

  async authorize(
    query: GetConseillersEtablissementQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserConseillerSuperviseurDeLEtablissement(
      utilisateur,
      query.idAgence
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
