import { Injectable } from '@nestjs/common'
import { Authentification } from '../../../domain/authentification'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { ActionAuthorizer } from '../../authorizers/authorize-action'
import { ActionQueryModel } from '../query-models/actions.query-model'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToActionQueryModelWithJeune } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { Result } from '../../../building-blocks/types/result'

export interface GetDetailActionQuery extends Query {
  idAction: string
}

@Injectable()
export class GetDetailActionQueryHandler extends QueryHandler<
  GetDetailActionQuery,
  ActionQueryModel | undefined
> {
  constructor(private actionAuthorizer: ActionAuthorizer) {
    super('GetDetailActionQueryHandler')
  }

  async handle(
    query: GetDetailActionQuery
  ): Promise<ActionQueryModel | undefined> {
    const actionSqlModel = await ActionSqlModel.findByPk(query.idAction, {
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })
    if (!actionSqlModel) return undefined

    return fromSqlToActionQueryModelWithJeune(actionSqlModel)
  }

  async authorize(
    query: GetDetailActionQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.actionAuthorizer.authorize(query.idAction, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
