import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Query } from '../../../building-blocks/types/query'
import {
  emptySuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import { ArchiveJeune } from '../../../domain/archive-jeune'
import { MotifSuppressionV2QueryModel } from '../query-models/jeunes.query-model'

@Injectable()
export class GetMotifsSuppressionJeuneV2QueryHandler extends QueryHandler<
  Query,
  Result<MotifSuppressionV2QueryModel[]>
> {
  constructor() {
    super('GetMotifsSuppressionJeuneV2QueryHandler')
  }

  async handle(_query: Query): Promise<Result<MotifSuppressionV2QueryModel[]>> {
    return success(
      Object.values(ArchiveJeune.MotifSuppressionV2).map(motif => {
        return {
          motif,
          description: ArchiveJeune.mapMotifSuppressionV2Description[motif]
        }
      })
    )
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
