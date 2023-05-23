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
    const structureConseiller = query.structure

    const motifsDeSuppression: string[] = Object.values(
      ArchiveJeune.MotifsSuppression
    ).filter(unMotif => {
      const { structures } = ArchiveJeune.motifsDeSuppression[unMotif]
      return structures.includes(structureConseiller)
    })

    return success(
      motifsDeSuppression.map((unMotif: ArchiveJeune.MotifsSuppression) => {
        const { motif, description } = ArchiveJeune.motifsDeSuppression[unMotif]

        return {
          motif,
          description
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
