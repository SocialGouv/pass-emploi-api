import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { Authentification } from '../../domain/authentification'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { Injectable } from '@nestjs/common'

export interface GetMetadonneesFavorisJeuneQuery {
  idJeune: string
}

export interface MetadonneesFavorisJeuneQueryModel {
  favoris: {
    autoriseLePartage: boolean
    offres: {
      total: number
      nombreOffresImmersion: number
      nombreOffresServiceCivique: number
      nombreOffresAlternance: number
      nombreOffresEmploi: number
    }
  }
}

@Injectable()
export class GetMetadonneesFavorisJeuneQueryHandler extends QueryHandler<
  GetMetadonneesFavorisJeuneQuery,
  Result<MetadonneesFavorisJeuneQueryModel>
> {
  constructor(
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer
  ) {
    super('GetMetadonneesFavorisJeuneQueryHandler')
  }

  async authorize(
    query: GetMetadonneesFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerForJeuneAuthorizer.authorize(
      query.idJeune,
      utilisateur
    )
  }

  async handle(
    query: GetMetadonneesFavorisJeuneQuery
  ): Promise<Result<MetadonneesFavorisJeuneQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      attributes: ['preferences_partage_favoris']
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const autoriseLePartage = jeuneSqlModel.getDataValue(
      'preferences_partage_favoris'
    )

    const nombreOffresImmersion = await FavoriOffreImmersionSqlModel.count({
      where: {
        idJeune: query.idJeune
      }
    })
    const nombreOffresServiceCivique =
      await FavoriOffreEngagementSqlModel.count({
        where: {
          idJeune: query.idJeune
        }
      })
    const nombreOffresAlternance = await FavoriOffreEmploiSqlModel.count({
      where: {
        idJeune: query.idJeune,
        is_alternance: true
      }
    })
    const nombreOffresEmploi = await FavoriOffreEmploiSqlModel.count({
      where: {
        idJeune: query.idJeune,
        is_alternance: null
      }
    })
    const total =
      nombreOffresImmersion +
      nombreOffresAlternance +
      nombreOffresServiceCivique +
      nombreOffresEmploi
    return success({
      favoris: {
        autoriseLePartage,
        offres: {
          total,
          nombreOffresImmersion,
          nombreOffresServiceCivique,
          nombreOffresAlternance,
          nombreOffresEmploi
        }
      }
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
