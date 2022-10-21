import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { TemplateActionQueryModel } from './query-models/actions.query-model'

@Injectable()
export class GetTemplatesActionQueryHandler extends QueryHandler<
  Query,
  TemplateActionQueryModel[]
> {
  constructor() {
    super('GetTemplatesActionsQueryHandler')
  }

  async handle(_query: Query): Promise<TemplateActionQueryModel[]> {
    return Action.TEMPLATES
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
