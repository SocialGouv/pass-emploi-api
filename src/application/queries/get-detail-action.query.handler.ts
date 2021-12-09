import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { authorizeAction } from '../authorizers/authorize-action'
import { ActionQueryModel } from './query-models/actions.query-model'

export interface GetDetailActionQuery extends Query {
  idAction: string
  utilisateur: Authentification.Utilisateur
}

@Injectable()
export class GetDetailActionQueryHandler extends QueryHandler<
  GetDetailActionQuery,
  ActionQueryModel | undefined
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository
  ) {
    super()
  }

  async handle(
    query: GetDetailActionQuery
  ): Promise<ActionQueryModel | undefined> {
    return this.actionRepository.getQueryModelById(query.idAction)
  }

  async authorize(query: GetDetailActionQuery): Promise<void> {
    const action = await this.actionRepository.get(query.idAction)
    authorizeAction(query.utilisateur, action)
  }
}
