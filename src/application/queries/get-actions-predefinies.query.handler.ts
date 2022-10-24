import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { ActionPredefinieQueryModel } from './query-models/actions.query-model'

@Injectable()
export class GetActionsPredefiniesQueryHandler extends QueryHandler<
  Query,
  ActionPredefinieQueryModel[]
> {
  constructor() {
    super('GetActionsPredefiniesQueryHandler')
  }

  async handle(_query: Query): Promise<ActionPredefinieQueryModel[]> {
    return Action.ACTIONS_PREDEFINIES
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
