import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune } from 'src/domain/jeune'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from 'src/domain/offre-immersion'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import {
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from './query-models/offres-immersion.query-models'

export interface GetFavorisOffresImmersionJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisOffresImmersionJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresImmersionJeuneQuery,
  OffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private readonly offresImmersionRepository: OffresImmersion.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetFavorisOffresImmersionJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresImmersionJeuneQuery
  ): Promise<OffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]> {
    return query.detail
      ? this.offresImmersionRepository.getFavorisQueryModelsByJeune(
          query.idJeune
        )
      : this.offresImmersionRepository.getFavorisIdsQueryModelsByJeune(
          query.idJeune
        )
  }
  async authorize(
    query: GetFavorisOffresImmersionJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
