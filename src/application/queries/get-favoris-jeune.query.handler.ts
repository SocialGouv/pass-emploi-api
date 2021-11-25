import { Inject, Injectable } from '@nestjs/common'
import { Jeune } from 'src/domain/jeune'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from 'src/domain/offre-emploi'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { OffreEmploiResumeQueryModel } from './query-models/offres-emploi.query-models'

export interface GetFavorisJeuneQuery extends Query {
  idJeune: Jeune.Id
}

@Injectable()
export class GetFavorisJeuneQueryHandler
  implements QueryHandler<GetFavorisJeuneQuery, OffreEmploiResumeQueryModel[]>
{
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: OffresEmploi.Repository
  ) {}

  execute(query: GetFavorisJeuneQuery): Promise<OffreEmploiResumeQueryModel[]> {
    return this.offresEmploiRepository.getFavorisQueryModelsByJeune(
      query.idJeune
    )
  }
}
