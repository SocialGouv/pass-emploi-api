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
import { OffreEmploiResumeQueryModel } from './query-models/offres-emploi.query-models'

export interface GetFavorisJeuneQuery extends Query {
  idJeune: Jeune.Id
}

@Injectable()
export class GetFavorisJeuneQueryHandler extends QueryHandler<
  GetFavorisJeuneQuery,
  OffreEmploiResumeQueryModel[]
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: OffresEmploi.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super()
  }

  handle(query: GetFavorisJeuneQuery): Promise<OffreEmploiResumeQueryModel[]> {
    return this.offresEmploiRepository.getFavorisQueryModelsByJeune(
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
