import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action } from '../../domain/action'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { ActionQueryModel } from './query-models/actions.query-model'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToActionQueryModel } from '../../infrastructure/repositories/mappers/actions.mappers'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { Sequelize } from 'sequelize'

const LIMITE_NOMBRE_ACTIONS_PAR_PAGE = 10

export interface GetActionsByJeuneQuery extends Query {
  idJeune: string
  page?: number
  tri?: Action.Tri
  statuts?: Action.Statut[]
}

export interface ActionsByJeune {
  actions: ActionQueryModel[]
  nombreTotal: number
}

@Injectable()
export class GetActionsByJeuneQueryHandler extends QueryHandler<
  GetActionsByJeuneQuery,
  ActionsByJeune
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetActionsByJeuneQueryHandler')
  }

  async handle(query: GetActionsByJeuneQuery): Promise<ActionsByJeune> {
    const nombreTotalActionsSql = await ActionSqlModel.count({
      where: {
        idJeune: query.idJeune
      }
    })
    const pageMax =
      nombreTotalActionsSql === 0
        ? 1
        : Math.ceil(nombreTotalActionsSql / LIMITE_NOMBRE_ACTIONS_PAR_PAGE)
    if (query.page && query.page > pageMax) {
      throw new HttpException('Page non trouvée.', HttpStatus.NOT_FOUND)
    }

    const filtres: { idJeune: string; statut?: Action.Statut[] } = {
      idJeune: query.idJeune
    }
    if (query.statuts) {
      filtres.statut = query.statuts
    }
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        ...filtres
      },
      order: [
        this.sequelize.literal(
          `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
        ),
        [
          'date_derniere_actualisation',
          query.tri ? mapFiltreTriToSql[query.tri] : 'DESC'
        ]
      ],
      limit: query.page
        ? LIMITE_NOMBRE_ACTIONS_PAR_PAGE
        : nombreTotalActionsSql,
      offset: query.page
        ? (query.page - 1) * LIMITE_NOMBRE_ACTIONS_PAR_PAGE
        : 0,
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })

    return {
      actions: actionsSqlModel.map(fromSqlToActionQueryModel),
      nombreTotal: nombreTotalActionsSql
    }
  }

  async authorize(
    query: GetActionsByJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}

const mapFiltreTriToSql: Record<Action.Tri, string> = {
  date_croissante: 'ASC',
  date_decroissante: 'DESC'
}
