import { Injectable } from '@nestjs/common'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { fromSqlToActionQueryModelWithJeune } from '../../../infrastructure/repositories/mappers/actions.mappers'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ActionAuthorizer } from '../../authorizers/action-authorizer'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { ActionQueryModel } from '../query-models/actions.query-model'

export interface GetDetailActionQuery extends Query {
  idAction: string
}

@Injectable()
export class GetDetailActionQueryHandler extends QueryHandler<
  GetDetailActionQuery,
  ActionQueryModel | undefined
> {
  constructor(
    private actionAuthorizer: ActionAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
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
    if (Authentification.estConseiller(utilisateur.type)) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourUneActionDeSonJeuneOuDUnJeuneDeSonAgenceMilo(
        query.idAction,
        utilisateur
      )
    }
    return this.actionAuthorizer.autoriserPourUneAction(
      query.idAction,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
