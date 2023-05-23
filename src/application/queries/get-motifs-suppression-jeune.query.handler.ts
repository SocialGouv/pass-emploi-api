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

@Injectable()
export class GetMotifsSuppressionJeuneQueryHandler extends QueryHandler<
  Query,
  Result<MotifSuppressionJeuneQueryModel[]>
> {
  constructor() {
    super('GetMotifsSuppressionJeuneQueryHandler')
  }

  async handle(
    _query: Query
  ): Promise<Result<MotifSuppressionJeuneQueryModel[]>> {
    // TODO : faire le filter en fonction de la structure pour ne remonter que les motifs qui vont bien au conseiller
    console.log('---------------------nouveaux----------------------------')
    Object.values(ArchiveJeune.MotifsSuppression).map(motif => {
      console.log(ArchiveJeune.motifsDeSuppression[motif].motif)
    })

    console.log('---------------------anciens----------------------------')
    return success(
      Object.values(ArchiveJeune.MotifSuppression).map(motif => {
        console.log(motif)
        return {
          motif,
          description: ArchiveJeune.mapMotifSuppressionDescription[motif]
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
