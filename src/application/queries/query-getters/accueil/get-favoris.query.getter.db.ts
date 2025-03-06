import { Injectable, Logger } from '@nestjs/common'
import { FavorisQueryModel } from '../../query-models/favoris.query-model'
import { FavoriOffreEmploiSqlModel } from '../../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import {
  fromOffreEmploiSqlToFavorisQueryModel,
  fromOffreImmersionSqlToFavorisQueryModel,
  fromOffreServiceCiviqueSqlToFavorisQueryModel
} from '../../query-mappers/favoris.mappers'
import { DateTime } from 'luxon'

export interface GetFavorisAccueilQuery {
  idJeune: string
}

@Injectable()
export class GetFavorisAccueilQueryGetter {
  private logger: Logger
  constructor() {
    this.logger = new Logger('GetFavorisAccueilQueryGetter')
  }

  async handle(query: GetFavorisAccueilQuery): Promise<FavorisQueryModel[]> {
    const [
      listeFavorisOffresEmploi,
      listeFavorisOffresImmersion,
      listeFavorisOffresServiceCivique
    ] = await Promise.all([
      FavoriOffreEmploiSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        },
        order: [['date_creation', 'DESC']],
        limit: 3
      }),
      FavoriOffreImmersionSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        },
        order: [['date_creation', 'DESC']],
        limit: 3
      }),
      FavoriOffreEngagementSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        },
        order: [['date_creation', 'DESC']],
        limit: 3
      })
    ])

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
      .sort(compareDateCreationAntechronologique)
      .slice(0, 3)
  }
}

export function compareDateCreationAntechronologique(
  favori1: FavorisQueryModel,
  favori2: FavorisQueryModel
): number {
  return DateTime.fromISO(favori2.dateCreation)
    .diff(DateTime.fromISO(favori1.dateCreation))
    .toMillis()
}
