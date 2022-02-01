import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Recherche, RecherchesRepositoryToken } from '../../domain/recherche'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { RechercheQueryModel } from './query-models/recherches.query-model'

export interface GetRecherchesQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetRecherchesQueryHandler extends QueryHandler<
  GetRecherchesQuery,
  RechercheQueryModel[]
> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetRecherchesQueryHandler')
  }

  handle(query: GetRecherchesQuery): Promise<RechercheQueryModel[]> {
    return this.rechercheRepository.getRecherches(query.idJeune)
  }
  async authorize(
    query: GetRecherchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
