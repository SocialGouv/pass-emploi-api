import { QueryHandler } from '../../building-blocks/types/query-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { fromOffreEmploiSqlToFavorisQueryModel } from './query-mappers/favoris.mappers'
import { FavorisQueryModel } from './query-models/favoris.query-model'

interface GetFavorisJeunePourConseillerQuery {
  idJeune: string
}
export class GetFavorisJeunePourConseillerQueryHandler extends QueryHandler<
  GetFavorisJeunePourConseillerQuery,
  FavorisQueryModel[]
> {
  constructor() {
    super('GetFavorisJeunePourConseillerQueryHandler')
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    query: GetFavorisJeunePourConseillerQuery
  ): Promise<FavorisQueryModel[]> {
    const listeFavorisOffresEmploi: FavoriOffreEmploiSqlModel[] = []
    const unFavori = await FavoriOffreEmploiSqlModel.findOne({
      where: {
        idJeune: query.idJeune
      }
    })
    if (!unFavori) {
      return []
    }
    listeFavorisOffresEmploi.push(unFavori)
    return listeFavorisOffresEmploi.map(fromOffreEmploiSqlToFavorisQueryModel)
  }

  async monitor(): Promise<void> {
    return
  }
}
