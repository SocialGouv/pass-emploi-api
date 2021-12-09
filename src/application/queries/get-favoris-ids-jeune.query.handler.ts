import { Inject, Injectable } from '@nestjs/common'
import { Jeune } from 'src/domain/jeune'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from 'src/domain/offre-emploi'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { FavoriIdQueryModel } from './query-models/offres-emploi.query-models'

export interface GetFavorisIdsJeuneQuery extends Query {
  idJeune: Jeune.Id
}

@Injectable()
export class GetFavorisIdsJeuneQueryHandler extends QueryHandler<
  GetFavorisIdsJeuneQuery,
  FavoriIdQueryModel[]
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: OffresEmploi.Repository
  ) {
    super()
  }

  handle(query: GetFavorisIdsJeuneQuery): Promise<FavoriIdQueryModel[]> {
    return this.offresEmploiRepository.getFavorisIdsQueryModelsByJeune(
      query.idJeune
    )
  }
  async authorize(query: GetFavorisIdsJeuneQuery): Promise<void> {
    if (query) {
    }
  }
}
