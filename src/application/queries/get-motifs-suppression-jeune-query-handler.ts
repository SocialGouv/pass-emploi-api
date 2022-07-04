import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Query } from '../../building-blocks/types/query'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'

export enum TypesMotifsSuppressionJeune {
  SORTIE_POSITIVE_DU_CEJ = 'Sortie positive du CEJ',
  RADIATION_DU_CEJ = 'Radiation du CEJ',
  RECREATION_D_UN_COMPTE_JEUNE = "Recréation d'un compte jeune",
  AUTRE = 'Autre'
}

export type MotifsSuppressionJeuneQueryModel = TypesMotifsSuppressionJeune[]

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
    return success(Object.values(TypesMotifsSuppressionJeune))
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
