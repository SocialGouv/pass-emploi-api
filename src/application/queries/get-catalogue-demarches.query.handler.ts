import { Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core, beneficiaireEstFTConnect } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { ThematiqueQueryModel } from './query-models/catalogue.query-model'

import { catalogueDemarchesInMemory } from 'src/infrastructure/clients/utils/demarches-in-memory'

export interface GetCatalogueDemarchesQuery extends Query {
  accessToken: string
  structure: Core.Structure
}

@Injectable()
export class GetCatalogueDemarchesQueryHandler extends QueryHandler<
  GetCatalogueDemarchesQuery,
  ThematiqueQueryModel[]
> {
  constructor(private readonly jeuneAuthorizer: JeuneAuthorizer) {
    super('GetCatalogueQueryHandler')
  }

  async handle(
    _query: GetCatalogueDemarchesQuery
  ): Promise<ThematiqueQueryModel[]> {
    return catalogueDemarchesInMemory.map(thematique => {
      return {
        code: thematique.code,
        libelle: thematique.libelle,
        demarches: thematique.demarches.map(demarche => ({
          ...demarche,
          commentObligatoire: false,
          comment: []
        }))
      }
    })
  }

  async authorize(
    _query: GetCatalogueDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      utilisateur.id,
      utilisateur,
      beneficiaireEstFTConnect(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
