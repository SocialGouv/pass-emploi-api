import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { ActionQueryModel } from './query-models/actions.query-model'

export interface GetActionsByJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetActionsByJeuneQueryHandler extends QueryHandler<
  GetActionsByJeuneQuery,
  ActionQueryModel[]
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository
  ) {
    super()
  }

  async handle(query: GetActionsByJeuneQuery): Promise<ActionQueryModel[]> {
    return this.actionRepository.getQueryModelByJeuneId(query.idJeune)
  }
  async authorize(query: GetActionsByJeuneQuery): Promise<void> {
    if (query) {
    }
  }
}
