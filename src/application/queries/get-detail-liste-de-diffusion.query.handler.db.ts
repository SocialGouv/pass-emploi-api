import { failure, Result, success } from '../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Query } from '../../building-blocks/types/query'
import { ListeDeDiffusionQueryModel } from './query-models/liste-de-diffusion.query-model'
import { ListeDeDiffusionAuthorizer } from '../authorizers/liste-de-diffusion-authorizer'
import { Authentification } from '../../domain/authentification'
import { ListeDeDiffusionSqlModel } from '../../infrastructure/sequelize/models/liste-de-diffusion.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToListeDeDiffusionQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { NonTrouveError } from '../../building-blocks/types/domain-error'

export interface GetDetailListeDeDiffusionQuery extends Query {
  idListeDeDiffusion: string
}

@Injectable()
export class GetDetailListeDeDiffusionQueryHandler extends QueryHandler<
  GetDetailListeDeDiffusionQuery,
  Result<ListeDeDiffusionQueryModel>
> {
  constructor(private listeDiffusionAuthorizer: ListeDeDiffusionAuthorizer) {
    super('GetDetailListeDeDiffusionQueryHandler')
  }
  async authorize(
    query: GetDetailListeDeDiffusionQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.listeDiffusionAuthorizer.autoriserConseillerPourSaListeDeDiffusion(
      query.idListeDeDiffusion,
      utilisateur
    )
  }

  async handle(
    query: GetDetailListeDeDiffusionQuery
  ): Promise<Result<ListeDeDiffusionQueryModel>> {
    const listeDeDiffusionSql = await ListeDeDiffusionSqlModel.findByPk(
      query.idListeDeDiffusion,
      {
        include: [JeuneSqlModel]
      }
    )
    if (listeDeDiffusionSql) {
      return success(fromSqlToListeDeDiffusionQueryModel(listeDeDiffusionSql))
    }
    return failure(
      new NonTrouveError('ListeDeDiffusion', query.idListeDeDiffusion)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
