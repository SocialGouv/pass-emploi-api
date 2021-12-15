import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune } from 'src/domain/jeune'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from 'src/domain/offre-emploi'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
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
    private readonly offresEmploiRepository: OffresEmploi.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super()
  }

  handle(query: GetFavorisIdsJeuneQuery): Promise<FavoriIdQueryModel[]> {
    return this.offresEmploiRepository.getFavorisIdsQueryModelsByJeune(
      query.idJeune
    )
  }
  async authorize(
    query: GetFavorisIdsJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }
}
