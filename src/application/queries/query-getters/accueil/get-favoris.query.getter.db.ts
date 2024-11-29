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
      .sort(comparerFavorisParDateCreationOuTitre)
      .slice(0, 3)
  }
}

function comparerTitreDeFavoris(
  favori1: FavorisQueryModel,
  favori2: FavorisQueryModel
): number {
  if (favori1.titre >= favori2.titre) {
    return 1
  } else {
    return -1
  }
}

function comparerDateCreationDeFavoris(
  favori1: FavorisQueryModel,
  favori2: FavorisQueryModel
): number {
  if (
    (favori1.dateCreation ? DateTime.fromISO(favori1.dateCreation!) : 0) >=
    (favori2.dateCreation ? DateTime.fromISO(favori2.dateCreation!) : 0)
  ) {
    return -1
  } else {
    return 1
  }
}

export function comparerFavorisParDateCreationOuTitre(
  favori1: FavorisQueryModel,
  favori2: FavorisQueryModel
): number {
  if (!favori1.dateCreation && !favori2.dateCreation) {
    return comparerTitreDeFavoris(favori1, favori2)
  } else if (favori1.dateCreation && favori2.dateCreation) {
    return comparerDateCreationDeFavoris(favori1, favori2)
  } else if (favori1.dateCreation && !favori2.dateCreation) {
    return -1
  } else {
    return 1
  }
}
