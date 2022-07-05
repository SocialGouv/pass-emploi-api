import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Query } from '../../building-blocks/types/query'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import { ArchiveJeune } from '../../domain/archive-jeune'

export type MotifsSuppressionJeuneQueryModel = ArchiveJeune.MotifSuppression[]

@Injectable()
export class GetMotifsSuppressionJeuneQueryHandler extends QueryHandler<
  Query,
  Result<MotifsSuppressionJeuneQueryModel>
> {
  constructor() {
    super('GetMotifsSuppressionJeuneQueryHandler')
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: Query
  ): Promise<Result<MotifsSuppressionJeuneQueryModel>> {
    return success(Object.values(ArchiveJeune.MotifSuppression))
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
