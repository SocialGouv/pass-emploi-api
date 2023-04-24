import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Recherche } from '../../../domain/offre/recherche/recherche'
import { FavoriOffreEmploiSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../../../infrastructure/sequelize/models/recherche.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { MetadonneesFavorisQueryModel } from '../query-models/favoris.query-model'

export interface GetMetadonneesFavorisJeuneQuery {
  idJeune: string
}

@Injectable()
export class GetMetadonneesFavorisJeuneQueryHandler extends QueryHandler<
  GetMetadonneesFavorisJeuneQuery,
  Result<MetadonneesFavorisQueryModel>
> {
  constructor(
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer
  ) {
    super('GetMetadonneesFavorisJeuneQueryHandler')
  }

  async authorize(
    query: GetMetadonneesFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
      query.idJeune,
      utilisateur
    )
  }

  async handle(
    query: GetMetadonneesFavorisJeuneQuery
  ): Promise<Result<MetadonneesFavorisQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune)

    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const [
      nombreOffresEmplois,
      nombreOffresAlternance,
      nombreOffresImmersions,
      nombreOffresServiceCivique,
      nombreRecherchesOffresEmplois,
      nombreRecherchesOffresAlternance,
      nombreRecherchesOffresImmersions,
      nombreRecherchesOffresServiceCivique
    ] = await Promise.all([
      FavoriOffreEmploiSqlModel.count({
        where: {
          idJeune: query.idJeune,
          isAlternance: {
            [Op.not]: true
          }
        }
      }),
      FavoriOffreEmploiSqlModel.count({
        where: {
          idJeune: query.idJeune,
          isAlternance: true
        }
      }),
      FavoriOffreImmersionSqlModel.count({
        where: {
          idJeune: query.idJeune
        }
      }),
      FavoriOffreEngagementSqlModel.count({
        where: {
          idJeune: query.idJeune
        }
      }),
      RechercheSqlModel.count({
        where: { idJeune: query.idJeune, type: Recherche.Type.OFFRES_EMPLOI }
      }),
      RechercheSqlModel.count({
        where: {
          idJeune: query.idJeune,
          type: Recherche.Type.OFFRES_ALTERNANCE
        }
      }),
      RechercheSqlModel.count({
        where: { idJeune: query.idJeune, type: Recherche.Type.OFFRES_IMMERSION }
      }),
      RechercheSqlModel.count({
        where: {
          idJeune: query.idJeune,
          type: Recherche.Type.OFFRES_SERVICES_CIVIQUE
        }
      })
    ])

    return success({
      favoris: {
        autoriseLePartage: jeuneSqlModel.partageFavoris,
        offres: {
          total:
            nombreOffresEmplois +
            nombreOffresAlternance +
            nombreOffresImmersions +
            nombreOffresServiceCivique,
          nombreOffresEmploi: nombreOffresEmplois,
          nombreOffresAlternance: nombreOffresAlternance,
          nombreOffresImmersion: nombreOffresImmersions,
          nombreOffresServiceCivique: nombreOffresServiceCivique
        },
        recherches: {
          total:
            nombreRecherchesOffresEmplois +
            nombreRecherchesOffresAlternance +
            nombreRecherchesOffresImmersions +
            nombreRecherchesOffresServiceCivique,
          nombreRecherchesOffresEmploi: nombreRecherchesOffresEmplois,
          nombreRecherchesOffresAlternance: nombreRecherchesOffresAlternance,
          nombreRecherchesOffresImmersion: nombreRecherchesOffresImmersions,
          nombreRecherchesOffresServiceCivique:
            nombreRecherchesOffresServiceCivique
        }
      }
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
