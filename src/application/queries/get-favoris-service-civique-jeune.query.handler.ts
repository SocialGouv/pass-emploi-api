import { Inject, Injectable } from '@nestjs/common'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'

import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Core } from '../../domain/core'
import {
  OffreServiceCiviqueRepositoryToken,
  OffreServiceCivique
} from '../../domain/offre-service-civique'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { ServiceCiviqueQueryModel } from './query-models/service-civique.query-model'

export interface GetFavorisOffresEngagementJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisServiceCiviqueJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresEngagementJeuneQuery,
  ServiceCiviqueQueryModel[] | Core.Id[]
> {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private readonly offresServiceCiviqueRepository: OffreServiceCivique.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetFavorisServiceCiviqueJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresEngagementJeuneQuery
  ): Promise<ServiceCiviqueQueryModel[] | Core.Id[]> {
    if (query.detail) {
      return this.offresServiceCiviqueRepository.getFavorisByJeune(
        query.idJeune
      )
    } else {
      return this.offresServiceCiviqueRepository.getFavorisIdsByJeune(
        query.idJeune
      )
    }
  }
  async authorize(
    query: GetFavorisOffresEngagementJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
