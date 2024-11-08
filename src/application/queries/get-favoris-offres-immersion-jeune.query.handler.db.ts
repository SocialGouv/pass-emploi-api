import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'
import {
  fromSqlToFavorisOffreImmersionQueryModel,
  fromSqlToFavorisOffresImmersionIdsQueryModels
} from '../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import {
  FavoriOffreImmersionIdQueryModel,
  FavoriOffreImmersionQueryModel
} from './query-models/offres-immersion.query-model'

export interface GetFavorisOffresImmersionJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisOffresImmersionJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresImmersionJeuneQuery,
  FavoriOffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisOffresImmersionJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresImmersionJeuneQuery
  ): Promise<
    FavoriOffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]
  > {
    return query.detail
      ? this.getFavorisQueryModelsByJeune(query.idJeune)
      : this.getFavorisIdsQueryModelsByJeune(query.idJeune)
  }

  async authorize(
    query: GetFavorisOffresImmersionJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private async getFavorisIdsQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriOffreImmersionIdQueryModel[]> {
    const favorisIdsSql = await FavoriOffreImmersionSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    return fromSqlToFavorisOffresImmersionIdsQueryModels(favorisIdsSql)
  }

  private async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriOffreImmersionQueryModel[]> {
    const favorisSql = await FavoriOffreImmersionSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(fromSqlToFavorisOffreImmersionQueryModel)
  }
}
