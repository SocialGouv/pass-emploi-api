import { Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'
import { toFavoriOffreEmploi } from '../../infrastructure/repositories/mappers/offres-emploi.mappers'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import {
  FavoriOffreEmploiQueryModel,
  OffreEmploiResumeQueryModel
} from './query-models/offres-emploi.query-model'

export interface GetFavorisJeuneQuery extends Query {
  idJeune: Jeune.Id
  detail: boolean // TODO faire le ménage, c'est legacy (verif utilisation sur elastic)
}

@Injectable()
export class GetFavorisOffresEmploiJeuneQueryHandler extends QueryHandler<
  GetFavorisJeuneQuery,
  OffreEmploiResumeQueryModel[] | FavoriOffreEmploiQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisOffresEmploiJeuneQueryHandler')
  }

  handle(
    query: GetFavorisJeuneQuery
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiQueryModel[]> {
    return query.detail
      ? this.getObsoleteFavorisQueryModelsByJeune(query.idJeune)
      : this.getFavorisQueryModelsByJeune(query.idJeune)
  }

  async authorize(
    query: GetFavorisJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriOffreEmploiQueryModel[]> {
    const favorisIdsSql = await FavoriOffreEmploiSqlModel.findAll({
      attributes: ['idOffre'],
      where: {
        idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    return fromSqlToFavorisOffresEmploiQueryModels(favorisIdsSql)
  }

  private async getObsoleteFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<OffreEmploiResumeQueryModel[]> {
    const favorisSql = await FavoriOffreEmploiSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return favorisSql.map(toFavoriOffreEmploi)
  }
}

function fromSqlToFavorisOffresEmploiQueryModels(
  favorisIdsSql: FavoriOffreEmploiSqlModel[]
): FavoriOffreEmploiQueryModel[] {
  return favorisIdsSql.map(favori => {
    return {
      id: favori.idOffre,
      dateCandidature: favori.dateCandidature
        ? DateService.fromJSDateToISOString(favori.dateCandidature)
        : undefined
    }
  })
}
