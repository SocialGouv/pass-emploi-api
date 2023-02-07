import { Query } from '../../../building-blocks/types/query'
import { Injectable } from '@nestjs/common'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { GetActionsDuConseillerAQualifierQueryModel } from '../query-models/conseillers.query-model'
import { ConseillerAuthorizer } from '../../authorizers/authorize-conseiller'
import { Authentification } from '../../../domain/authentification'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { Action } from '../../../domain/action/action'
import { fromActionJeuneSqlToActionAQualifierQueryModel } from '../../../infrastructure/repositories/mappers/actions.mappers'

export interface GetActionsDuConseillerAQualifierQuery extends Query {
  idConseiller: string
  page: number
  limit: number
}

@Injectable()
export class GetActionsDuConseillerAQualifierQueryHandler extends QueryHandler<
  GetActionsDuConseillerAQualifierQuery,
  Result<GetActionsDuConseillerAQualifierQueryModel>
> {
  constructor(private conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetActionsDuConseillerAQualifierQueryHandler')
  }
  async authorize(
    query: GetActionsDuConseillerAQualifierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async handle(
    query: GetActionsDuConseillerAQualifierQuery
  ): Promise<Result<GetActionsDuConseillerAQualifierQueryModel>> {
    const actionsAQualifierSqlModel = await ActionSqlModel.findAndCountAll({
      include: {
        model: JeuneSqlModel,
        attributes: ['id', 'nom', 'prenom'],
        where: {
          idConseiller: query.idConseiller
        }
      },
      attributes: ['id', 'contenu', 'idJeune', 'dateFinReelle'],
      where: {
        statut: Action.Statut.TERMINEE,
        codeQualification: null
      },
      limit: query.limit,
      offset: (query.page - 1) * query.limit
    })

    return success({
      pagination: {
        page: query.page,
        limit: query.limit,
        total: actionsAQualifierSqlModel.count
      },
      resultats: actionsAQualifierSqlModel.rows.map(
        fromActionJeuneSqlToActionAQualifierQueryModel
      )
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
