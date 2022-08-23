import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { TypeQualificationQueryModel } from './query-models/actions.query-model'

@Injectable()
export class GetTypesQualificationsQueryHandler extends QueryHandler<
  Query,
  TypeQualificationQueryModel[]
> {
  constructor() {
    super('GetTypesQualificationsQueryHandler')
  }

  async handle(_query: Query): Promise<TypeQualificationQueryModel[]> {
    return Object.values(Action.CodeQualification).map(code => {
      return Action.mapCodeTypeQualification[code]
    })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
