import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune } from 'src/domain/jeune/jeune'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import {
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from './query-models/offres-immersion.query-model'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import {
  fromSqlToFavorisOffresImmersionIdsQueryModels,
  fromSqlToOffreImmersion
} from '../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { Result } from 'src/building-blocks/types/result'

export interface GetFavorisOffresImmersionJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisOffresImmersionJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresImmersionJeuneQuery,
  OffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisOffresImmersionJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresImmersionJeuneQuery
  ): Promise<OffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]> {
    return query.detail
      ? this.getFavorisQueryModelsByJeune(query.idJeune)
      : this.getFavorisIdsQueryModelsByJeune(query.idJeune)
  }

  async authorize(
    query: GetFavorisOffresImmersionJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
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
      }
    })

    return fromSqlToFavorisOffresImmersionIdsQueryModels(favorisIdsSql)
  }

  private async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<OffreImmersionQueryModel[]> {
    const favorisSql = await FavoriOffreImmersionSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(fromSqlToOffreImmersion)
  }
}
