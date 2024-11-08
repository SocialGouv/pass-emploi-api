import { Injectable } from '@nestjs/common'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'

import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Core } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { ServiceCiviqueQueryModel } from './query-models/service-civique.query-model'
import { FavoriOffreEngagementSqlModel } from '../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import {
  fromSqlToIds,
  fromSqlToOffreServiceCivique
} from '../../infrastructure/repositories/mappers/service-civique.mapper'

export interface GetFavorisOffresEngagementJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisServiceCiviqueJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresEngagementJeuneQuery,
  ServiceCiviqueQueryModel[] | Core.Id[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisServiceCiviqueJeuneQueryHandler')
  }

  async handle(
    query: GetFavorisOffresEngagementJeuneQuery
  ): Promise<ServiceCiviqueQueryModel[] | Core.Id[]> {
    const favorisSql = await FavoriOffreEngagementSqlModel.findAll({
      where: {
        idJeune: query.idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    if (query.detail) {
      return favorisSql.map(fromSqlToOffreServiceCivique)
    } else {
      return fromSqlToIds(favorisSql)
    }
  }

  async authorize(
    query: GetFavorisOffresEngagementJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
