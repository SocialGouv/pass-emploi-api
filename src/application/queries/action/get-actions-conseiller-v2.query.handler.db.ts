import { Injectable } from '@nestjs/common'
import { Op, Order } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Action } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerAuthorizer } from '../../authorizers/authorize-conseiller'
import { GetActionsConseillerV2QueryModel } from '../query-models/conseillers.query-model'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

export interface GetActionsConseillerV2Query extends Query {
  idConseiller: string
  page?: number
  limit?: number
  aQualifier?: boolean
}

@Injectable()
export class GetActionsConseillerV2QueryHandler extends QueryHandler<
  GetActionsConseillerV2Query,
  Result<GetActionsConseillerV2QueryModel>
> {
  constructor(private conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetActionsDuConseillerAQualifierQueryHandler')
  }
  async authorize(
    query: GetActionsConseillerV2Query,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async handle(
    query: GetActionsConseillerV2Query
  ): Promise<Result<GetActionsConseillerV2QueryModel>> {
    const page = query.page ?? DEFAULT_PAGE
    const limit = query.limit ?? DEFAULT_LIMIT

    let whereClause = {}
    let order: Order | undefined

    switch (query.aQualifier) {
      case true:
        whereClause = {
          where: {
            statut: Action.Statut.TERMINEE,
            codeQualification: null
          }
        }
        order = [['date_fin_reelle', 'ASC']]
        break
      case false:
        whereClause = {
          where: {
            [Op.or]: {
              statut: { [Op.ne]: Action.Statut.TERMINEE },
              codeQualification: { [Op.ne]: null }
            }
          }
        }
    }

    const actionsSqlModel = await ActionSqlModel.findAndCountAll({
      include: {
        model: JeuneSqlModel,
        attributes: ['id', 'nom', 'prenom'],
        where: {
          idConseiller: query.idConseiller
        }
      },
      attributes: ['id', 'contenu', 'idJeune', 'dateFinReelle'],
      ...whereClause,
      limit,
      offset: (page - 1) * limit,
      order: order ?? [['date_creation', 'ASC']]
    })

    return success({
      pagination: {
        page,
        limit,
        total: actionsSqlModel.count
      },
      resultats: actionsSqlModel.rows.map(actionSql => ({
        id: actionSql.id,
        titre: actionSql.contenu,
        jeune: {
          id: actionSql.jeune.id,
          nom: actionSql.jeune.nom,
          prenom: actionSql.jeune.prenom
        },
        dateFinReelle: actionSql.dateFinReelle?.toDateString()
      }))
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
