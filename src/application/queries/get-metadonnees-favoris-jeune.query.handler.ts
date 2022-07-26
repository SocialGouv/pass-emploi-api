import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'

interface GetMetadonneesFavorisJeuneQuery {
  idJeune: string
}

interface MetadonneesFavorisJeuneQueryModel {
  nombreOffresImmersion: number
  nombreOffresServiceCivique: number
  nombreOffresAlternance: number
  nombreOffresEmploi: number
}

export class GetMetadonneesFavorisJeuneQueryHandler extends QueryHandler<
  GetMetadonneesFavorisJeuneQuery,
  MetadonneesFavorisJeuneQueryModel
> {
  constructor() {
    super('GetMetadonneesFavorisJeuneQueryHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    query: GetMetadonneesFavorisJeuneQuery
  ): Promise<MetadonneesFavorisJeuneQueryModel> {
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
    return {
      nombreOffresImmersion,
      nombreOffresServiceCivique,
      nombreOffresAlternance,
      nombreOffresEmploi
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
