import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { isSuccess, Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { peutVoirLesCampagnes } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { GetActionsJeuneQueryHandler } from './action/get-actions-jeune.query.handler.db'
import { GetCampagneQueryGetter } from './query-getters/get-campagne.query.getter'
import { CampagneQueryModel } from './query-models/campagne.query-model'
import { JeuneHomeActionQueryModel } from './query-models/home-jeune.query-model'

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
    private getCampagneQueryGetter: GetCampagneQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetJeuneHomeActionsQueryHandler')
  }

  async handle(
    query: GetJeuneHomeActionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<JeuneHomeActionQueryModel> {
    const getCampagne = (): Promise<CampagneQueryModel | undefined> =>
      peutVoirLesCampagnes(utilisateur.structure)
        ? this.getCampagneQueryGetter.handle(query)
        : Promise.resolve(undefined)

    const [actionsJeuneResult, campagne] = await Promise.all([
      this.getActionsByJeuneQueryHandler.handle(query),
      getCampagne()
    ])

    return {
      actions: isSuccess(actionsJeuneResult)
        ? actionsJeuneResult.data.actions
        : [],
      campagne
    }
  }

  async authorize(
    query: GetJeuneHomeActionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
