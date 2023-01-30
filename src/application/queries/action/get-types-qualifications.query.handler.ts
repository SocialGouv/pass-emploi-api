import { Injectable } from '@nestjs/common'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import { Qualification } from '../../../domain/action/qualification'
import { TypeQualificationQueryModel } from '../query-models/actions.query-model'

@Injectable()
export class GetTypesQualificationsQueryHandler extends QueryHandler<
  Query,
  TypeQualificationQueryModel[]
> {
  constructor() {
    super('GetTypesQualificationsQueryHandler')
  }

  async handle(_query: Query): Promise<TypeQualificationQueryModel[]> {
    return Object.values(Qualification.Code).map(code => {
      return Qualification.mapCodeTypeQualification[code]
    })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
