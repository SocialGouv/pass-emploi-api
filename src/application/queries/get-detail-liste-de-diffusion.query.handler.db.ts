import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Query } from '../../building-blocks/types/query'
import { ListeDeDiffusionQueryModel } from './query-models/liste-de-diffusion.query-model'

export interface GetDetailListeDeDiffusionQuery extends Query {
  idListeDeDiffusion: string
}

@Injectable()
export class GetDetailListeDeDiffusionQueryHandler extends QueryHandler<
  GetDetailListeDeDiffusionQuery,
  Result<ListeDeDiffusionQueryModel>
> {
  constructor() {
    super('QueryHandler')
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(): Promise<Result<ListeDeDiffusionQueryModel>> {
    throw new Error('not implemented')
  }

  async monitor(): Promise<void> {
    return
  }
}
