import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from './query-models/offres-emploi.query-model'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import {
  fromSqlToFavorisOffresEmploiIdsQueryModels,
  toOffreEmploi
} from '../../infrastructure/repositories/mappers/offres-emploi.mappers'
import { Result } from '../../building-blocks/types/result'

export interface GetFavorisJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean
}

@Injectable()
export class GetFavorisOffresEmploiJeuneQueryHandler extends QueryHandler<
  GetFavorisJeuneQuery,
  OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisOffresEmploiJeuneQueryHandler')
  }

  handle(
    query: GetFavorisJeuneQuery
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]> {
    return query.detail
      ? this.getFavorisQueryModelsByJeune(query.idJeune)
      : this.getFavorisIdsQueryModelsByJeune(query.idJeune)
  }

  async authorize(
    query: GetFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private async getFavorisIdsQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriOffreEmploiIdQueryModel[]> {
    const favorisIdsSql = await FavoriOffreEmploiSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    return fromSqlToFavorisOffresEmploiIdsQueryModels(favorisIdsSql)
  }

  private async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<OffreEmploiResumeQueryModel[]> {
    const favorisSql = await FavoriOffreEmploiSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(toOffreEmploi)
  }
}
