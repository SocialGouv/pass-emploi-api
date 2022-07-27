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
import { RechercheSqlModel } from '../../infrastructure/sequelize/models/recherche.sql-model'
import { Recherche } from '../../domain/recherche'

export interface GetMetadonneesFavorisJeuneQuery {
  idJeune: string
}

interface MetadonneesFavorisOffresJeuneQueryModel {
  total: number
  nombreOffresImmersion: number
  nombreOffresServiceCivique: number
  nombreOffresAlternance: number
  nombreOffresEmploi: number
}

interface MetadonneesFavorisRecherchesJeuneQueryModel {
  total: number
  nombreRecherchesOffresImmersion: number
  nombreRecherchesOffresServiceCivique: number
  nombreRecherchesOffresAlternance: number
  nombreRecherchesOffresEmploi: number
}

export interface MetadonneesFavorisJeuneQueryModel {
  favoris: {
    autoriseLePartage: boolean
    offres: MetadonneesFavorisOffresJeuneQueryModel
    recherches: MetadonneesFavorisRecherchesJeuneQueryModel
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

    let offres!: MetadonneesFavorisOffresJeuneQueryModel
    await Promise.all([
      FavoriOffreEmploiSqlModel.count({
        where: {
          idJeune: query.idJeune,
          is_alternance: null
        }
      }),
      FavoriOffreEmploiSqlModel.count({
        where: {
          idJeune: query.idJeune,
          is_alternance: true
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
      })
    ]).then((comptes: number[]) => {
      offres = {
        total: comptes.reduce((total, compte) => total + compte, 0),
        nombreOffresEmploi: comptes[0],
        nombreOffresAlternance: comptes[1],
        nombreOffresImmersion: comptes[2],
        nombreOffresServiceCivique: comptes[3]
      }
    })

    let recherches!: MetadonneesFavorisRecherchesJeuneQueryModel
    await Promise.all([
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
    ]).then((comptes: number[]) => {
      recherches = {
        total: comptes.reduce((total, compte) => total + compte, 0),
        nombreRecherchesOffresEmploi: comptes[0],
        nombreRecherchesOffresAlternance: comptes[1],
        nombreRecherchesOffresImmersion: comptes[2],
        nombreRecherchesOffresServiceCivique: comptes[3]
      }
    })

    return success({
      favoris: {
        autoriseLePartage,
        offres,
        recherches
      }
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
