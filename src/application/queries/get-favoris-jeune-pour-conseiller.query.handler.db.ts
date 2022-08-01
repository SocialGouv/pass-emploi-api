import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import {
  fromOffreEmploiSqlToFavorisQueryModel,
  fromOffreImmersionSqlToFavorisQueryModel,
  fromOffreServiceCiviqueSqlToFavorisQueryModel
} from './query-mappers/favoris.mappers'
import { FavorisQueryModel } from './query-models/favoris.query-model'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { Authentification } from '../../domain/authentification'
import { ConseillerForJeuneAvecPartageAuthorizer } from '../authorizers/authorize-conseiller-for-jeune-avec-partage'

interface GetFavorisJeunePourConseillerQuery {
  idJeune: string
}

export class GetFavorisJeunePourConseillerQueryHandler extends QueryHandler<
  GetFavorisJeunePourConseillerQuery,
  FavorisQueryModel[]
> {
  constructor(
    private conseillerForJeuneAvecPartageAuthorizer: ConseillerForJeuneAvecPartageAuthorizer
  ) {
    super('GetFavorisJeunePourConseillerQueryHandler')
  }
  async authorize(
    query: GetFavorisJeunePourConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerForJeuneAvecPartageAuthorizer.authorize(
      query.idJeune,
      utilisateur
    )
  }

  async handle(
    query: GetFavorisJeunePourConseillerQuery
  ): Promise<FavorisQueryModel[]> {
    const listeFavorisOffresEmploi: FavoriOffreEmploiSqlModel[] =
      await FavoriOffreEmploiSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        }
      })
    const listeFavorisOffresImmersion: FavoriOffreImmersionSqlModel[] =
      await FavoriOffreImmersionSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        }
      })
    const listeFavorisOffresServiceCivique: FavoriOffreEngagementSqlModel[] =
      await FavoriOffreEngagementSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        }
      })
    return listeFavorisOffresEmploi
      .map(fromOffreEmploiSqlToFavorisQueryModel)
      .concat(
        listeFavorisOffresImmersion.map(
          fromOffreImmersionSqlToFavorisQueryModel
        )
      )
      .concat(
        listeFavorisOffresServiceCivique.map(
          fromOffreServiceCiviqueSqlToFavorisQueryModel
        )
      )
      .sort((favori1, favori2) => {
        if (favori1.titre >= favori2.titre) {
          return 1
        } else {
          return 0
        }
      })
  }

  async monitor(): Promise<void> {
    return
  }
}
