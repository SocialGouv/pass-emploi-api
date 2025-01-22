import { Inject, Injectable } from '@nestjs/common'
import { Op, Order, QueryTypes, Sequelize, WhereOptions } from 'sequelize'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Action } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { fromSqlToActionQueryModel } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { ActionQueryModel } from '../query-models/actions.query-model'

const OFFSET_PAR_DEFAUT = 0
const LIMITE_NOMBRE_ACTIONS_PAR_PAGE = 10

export interface GetActionsJeuneQuery extends Query {
  idJeune: string
  page?: number
  tri?: Action.Tri
  statuts?: Action.Statut[]
  etats?: Action.Qualification.Etat[]
  codesCategories?: Action.Qualification.Code[]
}

export interface ActionsJeuneQueryModel {
  actions: ActionQueryModel[]
  metadonnees: {
    nombreTotal: number
    nombreFiltrees: number
    nombreActionsParPage: number
  }
}

@Injectable()
export class GetActionsJeuneQueryHandler extends QueryHandler<
  GetActionsJeuneQuery,
  Result<ActionsJeuneQueryModel>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetActionsJeuneQueryHandler')
  }

  async handle(
    query: GetActionsJeuneQuery
  ): Promise<Result<ActionsJeuneQueryModel>> {
    const [actionsFiltrees, statutRawCount] = await Promise.all([
      this.findAndCountAllActionsFiltrees(query),
      this.compterActionsParStatut(query.idJeune)
    ])

    if (!laPageExiste(actionsFiltrees.count, query.page)) {
      return failure(new NonTrouveError('Page', query.page?.toString()))
    }

    const metadonnees = {
      nombreTotal: this.compterToutesLesActions(statutRawCount),
      nombreFiltrees: actionsFiltrees.count,
      nombreActionsParPage: LIMITE_NOMBRE_ACTIONS_PAR_PAGE
    }

    if (actionsFiltrees.count === 0) {
      return success({ metadonnees, actions: [] })
    }

    return success({
      metadonnees,
      actions: actionsFiltrees.rows.map(fromSqlToActionQueryModel)
    })
  }

  async authorize(
    query: GetActionsJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private async findAndCountAllActionsFiltrees(
    query: GetActionsJeuneQuery
  ): Promise<{
    rows: ActionSqlModel[]
    count: number
  }> {
    return ActionSqlModel.findAndCountAll({
      where: this.generateWhere(query),
      order: this.trier[query.tri ?? Action.Tri.STATUT],
      limit: generateLimit(query.page),
      offset: generateOffset(query.page),
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })
  }

  private compterActionsParStatut(
    idJeune: string
  ): Promise<Array<RawCount<Action.Statut>>> {
    return this.sequelize.query<RawCount<Action.Statut>>(
      `
        SELECT statut AS value, COUNT(*)
        FROM action
        WHERE id_jeune = :idJeune
        GROUP BY value;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          idJeune
        }
      }
    )
  }

  private compterToutesLesActions<T>(rawCount: Array<RawCount<T>>): number {
    return rawCount.reduce((total, { count }) => total + parseInt(count), 0)
  }

  private generateWhere(query: GetActionsJeuneQuery): WhereOptions {
    const where: WhereOptions = [{ id_jeune: query.idJeune }]

    if (query.etats?.length) {
      where.push(
        Sequelize.where(
          this.sequelize.literal(`CASE
            WHEN qualification_heures IS NOT null THEN 'QUALIFIEE'
            WHEN statut = 'done' THEN 'A_QUALIFIER'
            ELSE 'NON_QUALIFIABLE'
          END`),
          {
            [Op.in]: query.etats
          }
        )
      )
    }
    if (query.statuts) where.push({ statut: query.statuts })
    if (query.codesCategories)
      where.push({ qualification_code: { [Op.in]: query.codesCategories } })

    return where
  }

  private trier: Record<Action.Tri, Order> = {
    date_croissante: [['date_creation', 'ASC']],
    date_decroissante: [['date_creation', 'DESC']],
    date_echeance_croissante: [
      ['date_echeance', 'ASC'],
      ['date_creation', 'ASC']
    ],
    date_echeance_decroissante: [
      ['date_echeance', 'DESC'],
      ['date_creation', 'ASC']
    ],
    statut: [
      this.sequelize.literal(
        `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
      ),
      ['date_derniere_actualisation', 'DESC']
    ]
  }
}

function generateLimit(page?: number): number | undefined {
  return page ? LIMITE_NOMBRE_ACTIONS_PAR_PAGE : undefined
}

function generateOffset(page?: number): number {
  return page ? (page - 1) * LIMITE_NOMBRE_ACTIONS_PAR_PAGE : OFFSET_PAR_DEFAUT
}

function laPageExiste(nombreTotalActions: number, page?: number): boolean {
  if (!page || page === 1) {
    return true
  }
  const pageMax = Math.ceil(nombreTotalActions / LIMITE_NOMBRE_ACTIONS_PAR_PAGE)
  return page <= pageMax
}

interface RawCount<T> {
  value: T
  count: string
}
