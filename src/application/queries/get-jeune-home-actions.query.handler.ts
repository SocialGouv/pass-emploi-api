import { Injectable } from '@nestjs/common'
import { JeuneHomeActionQueryModel } from './query-models/home-jeune.query-model'
import { GetCampagneQueryModel } from './query-getters/get-campagne.query.getter'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { GetActionsJeuneQueryHandler } from './action/get-actions-jeune.query.handler.db'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { isSuccess, Result } from '../../building-blocks/types/result'

export interface GetJeuneHomeActionsQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetJeuneHomeActionsQueryHandler extends QueryHandler<
  GetJeuneHomeActionsQuery,
  JeuneHomeActionQueryModel
> {
  constructor(
    private getActionsByJeuneQueryHandler: GetActionsJeuneQueryHandler,
    private getCampagneQueryModel: GetCampagneQueryModel,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetJeuneHomeActionsQueryHandler')
  }

  async handle(
    query: GetJeuneHomeActionsQuery
  ): Promise<JeuneHomeActionQueryModel> {
    const [actionsJeuneResult, campagne] = await Promise.all([
      this.getActionsByJeuneQueryHandler.handle(query),
      this.getCampagneQueryModel.handle(query)
    ])

    return {
      actions: isSuccess(actionsJeuneResult)
        ? actionsJeuneResult.data.actions
        : [],
      campagne: campagne
    }
  }

  async authorize(
    query: GetJeuneHomeActionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
