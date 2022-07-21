import { Inject, Injectable } from '@nestjs/common'
import { Order, QueryTypes, Sequelize, WhereOptions } from 'sequelize'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action } from '../../domain/action'
import { fromSqlToActionQueryModel } from '../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { ActionQueryModel } from './query-models/actions.query-model'

const OFFSET_PAR_DEFAUT = 0
const LIMITE_NOMBRE_ACTIONS_PAR_PAGE = 10

export interface GetActionsByJeuneQuery extends Query {
  idJeune: string
  page?: number
  tri?: Action.Tri
  statuts?: Action.Statut[]
}

export interface ActionsByJeuneOutput {
  actions: ActionQueryModel[]
  metadonnees: {
    nombreTotal: number
    nombreEnCours: number
    nombreTerminees: number
    nombreAnnulees: number
    nombrePasCommencees: number
    nombreActionsParPage: number
  }
}

@Injectable()
export class GetActionsByJeuneQueryHandler extends QueryHandler<
  GetActionsByJeuneQuery,
  Result<ActionsByJeuneOutput>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetActionsByJeuneQueryHandler')
  }

  async handle(
    query: GetActionsByJeuneQuery
  ): Promise<Result<ActionsByJeuneOutput>> {
    const filtres = generateWhere(query)

    const [nombreTotalActionsFiltrees, statutRawCount] = await Promise.all([
      ActionSqlModel.count({
        where: filtres
      }),
      this.compterActionsParStatut(query)
    ])

    if (!laPageExiste(nombreTotalActionsFiltrees, query.page)) {
      return failure(new NonTrouveError('Page', query.page?.toString()))
    }

    const result: ActionsByJeuneOutput = {
      actions: [],
      metadonnees: {
        nombreTotal: this.compterToutesLesActions(statutRawCount),
        nombreEnCours: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.EN_COURS
        ),
        nombreTerminees: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.TERMINEE
        ),
        nombreAnnulees: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.ANNULEE
        ),
        nombrePasCommencees: this.getCompteDuStatut(
          statutRawCount,
          Action.Statut.PAS_COMMENCEE
        ),
        nombreActionsParPage: LIMITE_NOMBRE_ACTIONS_PAR_PAGE
      }
    }
    if (nombreTotalActionsFiltrees === 0) {
      return success(result)
    }

    const actionsSqlModel = await ActionSqlModel.findAll({
      where: filtres,
      order: this.trier[query.tri ?? Action.Tri.STATUT],
      limit: generateLimit(nombreTotalActionsFiltrees, query.page),
      offset: generateOffset(query.page),
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })

    return success({
      ...result,
      actions: actionsSqlModel.map(fromSqlToActionQueryModel)
    })
  }

  async authorize(
    query: GetActionsByJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }

  private compterActionsParStatut(
    query: GetActionsByJeuneQuery
  ): Promise<RawCount[]> {
    return this.sequelize.query(
      `
        SELECT statut, COUNT(*)
        FROM action
        WHERE id_jeune = :idJeune
        GROUP BY statut;
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          idJeune: query.idJeune
        }
      }
    ) as unknown as Promise<RawCount[]>
  }

  private compterToutesLesActions(statutRawCount: RawCount[]): number {
    return statutRawCount.reduce(
      (total, { count }) => total + parseInt(count),
      0
    )
  }

  private getCompteDuStatut(
    statutRawCount: RawCount[],
    statut: Action.Statut
  ): number {
    const count = statutRawCount.find(raw => raw.statut === statut)?.count
    return count ? parseInt(count) : 0
  }

  trier: Record<Action.Tri, Order> = {
    date_croissante: [['date_creation', 'ASC']],
    date_decroissante: [['date_creation', 'DESC']],
    statut: [
      this.sequelize.literal(
        `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
      ),
      ['date_derniere_actualisation', 'DESC']
    ]
  }
}

function generateLimit(nombreTotalActions: number, page?: number): number {
  return page ? LIMITE_NOMBRE_ACTIONS_PAR_PAGE : nombreTotalActions
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

function generateWhere(query: GetActionsByJeuneQuery): WhereOptions {
  const filtres: { idJeune: string; statut?: Action.Statut[] } = {
    idJeune: query.idJeune
  }
  if (query.statuts) {
    filtres.statut = query.statuts
  }
  return filtres
}

interface RawCount {
  statut: Action.Statut
  count: string
}
