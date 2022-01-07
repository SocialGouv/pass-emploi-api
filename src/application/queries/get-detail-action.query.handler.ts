import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { ActionAuthorizer } from '../authorizers/authorize-action'
import { ActionQueryModel } from './query-models/actions.query-model'

export interface GetDetailActionQuery extends Query {
  idAction: string
}

@Injectable()
export class GetDetailActionQueryHandler extends QueryHandler<
  GetDetailActionQuery,
  ActionQueryModel | undefined
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository,
    private actionAuthorizer: ActionAuthorizer
  ) {
    super()
  }

  async handle(
    query: GetDetailActionQuery
  ): Promise<ActionQueryModel | undefined> {
    return this.actionRepository.getQueryModelById(query.idAction)
  }

  async authorize(
    query: GetDetailActionQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.actionAuthorizer.authorize(query.idAction, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
