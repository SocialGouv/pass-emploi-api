import { Injectable } from '@nestjs/common'
import { JeuneHomeActionQueryModel } from './query-models/home-jeune.query-models'
import { GetCampagneQueryModel } from './query-getters/get-campagne.query.getter'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { GetActionsByJeuneQueryHandler } from './get-actions-by-jeune.query.handler.db'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface GetJeuneHomeActionsQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetJeuneHomeActionsQueryHandler extends QueryHandler<
  GetJeuneHomeActionsQuery,
  JeuneHomeActionQueryModel
> {
  constructor(
    private getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler,
    private getCampagneQueryModel: GetCampagneQueryModel,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetJeuneHomeActionsQueryHandler')
  }

  async handle(
    query: GetJeuneHomeActionsQuery
  ): Promise<JeuneHomeActionQueryModel> {
    const [actions, campagne] = await Promise.all([
      this.getActionsByJeuneQueryHandler.handle(query),
      this.getCampagneQueryModel.handle(query)
    ])

    return {
      actions: actions,
      campagne: campagne
    }
  }

  async authorize(
    query: GetJeuneHomeActionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
