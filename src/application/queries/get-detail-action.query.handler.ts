import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { ActionQueryModel } from './query-models/actions.query-model'

export interface GetDetailActionQuery extends Query {
  idAction: string
}

@Injectable()
export class GetDetailActionQueryHandler
  implements QueryHandler<GetDetailActionQuery, ActionQueryModel | undefined>
{
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository
  ) {}

  async execute(
    query: GetDetailActionQuery
  ): Promise<ActionQueryModel | undefined> {
    return this.actionRepository.getQueryModelById(query.idAction)
  }
}
