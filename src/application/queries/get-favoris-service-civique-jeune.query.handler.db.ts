import { Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'

import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'
import { fromSqlToOffreServiceCivique } from '../../infrastructure/repositories/mappers/service-civique.mapper'
import { FavoriOffreEngagementSqlModel } from '../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import {
  FavoriOffreServiceCiviqueQueryModel,
  ServiceCiviqueQueryModel
} from './query-models/service-civique.query-model'

export interface GetFavorisOffresEngagementJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisServiceCiviqueJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresEngagementJeuneQuery,
  ServiceCiviqueQueryModel[] | FavoriOffreServiceCiviqueQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisServiceCiviqueJeuneQueryHandler')
  }

  async handle(
    query: GetFavorisOffresEngagementJeuneQuery
  ): Promise<
    ServiceCiviqueQueryModel[] | FavoriOffreServiceCiviqueQueryModel[]
  > {
    const favorisSql = await FavoriOffreEngagementSqlModel.findAll({
      where: {
        idJeune: query.idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    if (query.detail) {
      return favorisSql.map(fromSqlToOffreServiceCivique)
    } else {
      return fromSqlToQueryModel(favorisSql)
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

export function fromSqlToQueryModel(
  favoriOffreEngagementSqlModels: FavoriOffreEngagementSqlModel[]
): FavoriOffreServiceCiviqueQueryModel[] {
  return favoriOffreEngagementSqlModels.map(favori => {
    return {
      id: favori.idOffre,
      dateCandidature: favori.dateCandidature
        ? DateService.fromJSDateToISOString(favori.dateCandidature)
        : undefined
    }
  })
}
