import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune } from 'src/domain/jeune'

import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Core } from '../../domain/core'
import {
  EngagementRepositoryToken,
  OffreEngagement
} from '../../domain/offre-engagement'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { OffreEngagementQueryModel } from './query-models/service-civique.query-models'

export interface GetFavorisOffresEngagementJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisOffresEngagementJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresEngagementJeuneQuery,
  OffreEngagementQueryModel[] | Core.Id[]
> {
  constructor(
    @Inject(EngagementRepositoryToken)
    private readonly offresEngagementRepository: OffreEngagement.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetFavorisOffresEngagementJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresEngagementJeuneQuery
  ): Promise<OffreEngagementQueryModel[] | Core.Id[]> {
    return query.detail
      ? this.offresEngagementRepository.getFavorisQueryModelsByJeune(
          query.idJeune
        )
      : this.offresEngagementRepository.getFavorisIdsQueryModelsByJeune(
          query.idJeune
        )
  }
  async authorize(
    query: GetFavorisOffresEngagementJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
