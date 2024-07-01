import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Query } from '../../building-blocks/types/query'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import { ArchiveJeune } from '../../domain/archive-jeune'
import { MotifSuppressionJeuneQueryModel } from './query-models/jeunes.query-model'
import { Core } from '../../domain/core'
import Structure = Core.Structure

export interface GetMotifsSuppressionQuery extends Query {
  structure: Structure
}
@Injectable()
export class GetMotifsSuppressionJeuneQueryHandler extends QueryHandler<
  Query,
  Result<MotifSuppressionJeuneQueryModel[]>
> {
  constructor() {
    super('GetMotifsSuppressionJeuneQueryHandler')
  }

  async handle(
    query: GetMotifsSuppressionQuery
  ): Promise<Result<MotifSuppressionJeuneQueryModel[]>> {
    return success(
      Object.entries(ArchiveJeune.motifsSuppression)
        .filter(([_, { structures }]) => structures.includes(query.structure))
        .map(([motif, { description }]) => ({
          motif,
          description: description
        }))
    )
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
