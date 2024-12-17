import { Injectable } from '@nestjs/common'
import { Op, OrderItem, WhereOptions } from 'sequelize'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetActionsConseillerV2QueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result, success } from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Qualification } from 'src/domain/action/qualification'
import { Authentification } from 'src/domain/authentification'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

export enum TriActionsConseillerV2 {
  BENEFICIAIRE_ALPHABETIQUE = 'BENEFICIAIRE_ALPHABETIQUE',
  BENEFICIAIRE_INVERSE = 'BENEFICIAIRE_INVERSE',
  REALISATION_CHRONOLOGIQUE = 'REALISATION_CHRONOLOGIQUE',
  REALISATION_ANTICHRONOLOGIQUE = 'REALISATION_ANTICHRONOLOGIQUE'
}
export interface GetActionsConseillerV2Query extends Query {
  idConseiller: string
  page?: number
  limit?: number
  codesCategories?: Action.Qualification.Code[]
  aQualifier?: boolean
  tri?: TriActionsConseillerV2
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
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async handle(
    query: GetActionsConseillerV2Query
  ): Promise<Result<GetActionsConseillerV2QueryModel>> {
    const page = query.page ?? DEFAULT_PAGE
    const limit = query.limit ?? DEFAULT_LIMIT

    let whereClause: WhereOptions | undefined
    let order: OrderItem[] | undefined

    switch (query.aQualifier) {
      case true:
        whereClause = {
          statut: Action.Statut.TERMINEE,
          heuresQualifiees: null
        }
        order = [['date_fin_reelle', 'ASC']]
        break
      case false:
        whereClause = {
          [Op.or]: {
            statut: { [Op.ne]: Action.Statut.TERMINEE },
            heuresQualifiees: { [Op.ne]: null }
          }
        }
        break
    }

    if (query.codesCategories) {
      whereClause = {
        ...(whereClause ?? {}),
        codeQualification: { [Op.in]: query.codesCategories }
      }
    }

    switch (query.tri) {
      case TriActionsConseillerV2.BENEFICIAIRE_ALPHABETIQUE:
        order = [
          ['jeune', 'nom', 'ASC'],
          ['jeune', 'prenom', 'ASC'],
          ...(order ?? [])
        ]
        break
      case TriActionsConseillerV2.BENEFICIAIRE_INVERSE:
        order = [
          ['jeune', 'nom', 'DESC'],
          ['jeune', 'prenom', 'DESC'],
          ...(order ?? [])
        ]
        break
      case TriActionsConseillerV2.REALISATION_CHRONOLOGIQUE:
        order = [['date_fin_reelle', 'ASC']]
        break
      case TriActionsConseillerV2.REALISATION_ANTICHRONOLOGIQUE:
        order = [['date_fin_reelle', 'DESC']]
        break
    }

    const actionsSqlModel = await ActionSqlModel.findAndCountAll({
      include: {
        model: JeuneSqlModel,
        attributes: ['id', 'nom', 'prenom'],
        where: {
          idConseiller: query.idConseiller
        },
        required: true
      },
      attributes: [
        'id',
        'contenu',
        'idJeune',
        'dateFinReelle',
        'codeQualification'
      ],
      ...(whereClause ? { where: whereClause } : {}),
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
        dateFinReelle: actionSql.dateFinReelle?.toISOString(),
        categorie: actionSql.codeQualification
          ? {
              code: actionSql.codeQualification,
              libelle:
                Qualification.mapCodeTypeQualification[
                  actionSql.codeQualification
                ].label
            }
          : undefined
      }))
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
