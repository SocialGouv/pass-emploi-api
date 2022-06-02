import { Inject, Injectable } from '@nestjs/common'
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

export interface GetActionsByJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetActionsByJeuneQueryHandler extends QueryHandler<
  GetActionsByJeuneQuery,
  ActionQueryModel[]
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetActionsByJeuneQueryHandler')
  }

  async handle(query: GetActionsByJeuneQuery): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune
      },
      order: [
        this.sequelize.literal(
          `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
        ),
        ['date_derniere_actualisation', 'DESC']
      ],
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })

    return actionsSqlModel.map(fromSqlToActionQueryModel)
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
