import { Injectable } from '@nestjs/common'
import { compareDateCreationAntechronologique } from 'src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
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
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetFavorisJeuneQueryHandler')
  }

  async authorize(
    query: GetFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estConseiller(utilisateur.type)) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMiloAvecPartageFavoris(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
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
      .sort(compareDateCreationAntechronologique)
  }

  async monitor(): Promise<void> {
    return
  }
}
