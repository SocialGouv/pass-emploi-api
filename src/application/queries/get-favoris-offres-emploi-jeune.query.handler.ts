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
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from './query-models/offres-emploi.query-model'

export interface GetFavorisJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisOffresEmploiJeuneQueryHandler extends QueryHandler<
  GetFavorisJeuneQuery,
  OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: OffresEmploi.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetFavorisOffresEmploiJeuneQueryHandler')
  }

  handle(
    query: GetFavorisJeuneQuery
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]> {
    return query.detail
      ? this.offresEmploiRepository.getFavorisQueryModelsByJeune(query.idJeune)
      : this.offresEmploiRepository.getFavorisIdsQueryModelsByJeune(
          query.idJeune
        )
  }
  async authorize(
    query: GetFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
