import { Injectable } from '@nestjs/common'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { ConseillerAgenceAuthorizer } from '../../authorizers/authorize-conseiller-agence'
import { JeuneAuthorizer } from '../../authorizers/authorize-jeune'
import {
  fromOffreEmploiSqlToFavorisQueryModel,
  fromOffreImmersionSqlToFavorisQueryModel,
  fromOffreServiceCiviqueSqlToFavorisQueryModel
} from '../query-mappers/favoris.mappers'
import { FavorisQueryModel } from '../query-models/favoris.query-model'

interface GetFavorisJeuneQuery {
  idJeune: string
}

@Injectable()
export class GetFavorisJeuneQueryHandler extends QueryHandler<
  GetFavorisJeuneQuery,
  FavorisQueryModel[]
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerAgenceAuthorizer
  ) {
    super('GetFavorisJeuneQueryHandler')
  }

  async authorize(
    query: GetFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgenceAvecPartageFavoris(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.authorizeJeune(query.idJeune, utilisateur)
  }

  async handle(query: GetFavorisJeuneQuery): Promise<FavorisQueryModel[]> {
    const [
      listeFavorisOffresEmploi,
      listeFavorisOffresImmersion,
      listeFavorisOffresServiceCivique
    ] = await Promise.all([
      FavoriOffreEmploiSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        }
      }),
      FavoriOffreImmersionSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        }
      }),
      FavoriOffreEngagementSqlModel.findAll({
        where: {
          idJeune: query.idJeune
        }
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
      .sort(comparerTitreDeFavoris)
  }

  async monitor(): Promise<void> {
    return
  }
}

function comparerTitreDeFavoris(
  favori1: FavorisQueryModel,
  favori2: FavorisQueryModel
): number {
  if (favori1.titre >= favori2.titre) {
    return 1
  } else {
    return 0
  }
}
