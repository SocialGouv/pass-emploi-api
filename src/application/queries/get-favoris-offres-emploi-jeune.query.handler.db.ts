import { Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { FavoriOffreEmploiQueryModel } from './query-models/offres-emploi.query-model'

interface GetFavorisOffresEmploiJeuneQuery extends Query {
  idJeune: Jeune.Id
}

@Injectable()
export class GetFavorisOffresEmploiJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresEmploiJeuneQuery,
  FavoriOffreEmploiQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisOffresEmploiJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresEmploiJeuneQuery
  ): Promise<FavoriOffreEmploiQueryModel[]> {
    return this.getFavorisQueryModelsByJeune(query.idJeune)
  }

  async authorize(
    query: GetFavorisOffresEmploiJeuneQuery,
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
      attributes: ['idOffre', 'dateCreation', 'dateCandidature'],
      where: {
        idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    return fromSqlToFavorisOffresEmploiQueryModels(favorisIdsSql)
  }
}

function fromSqlToFavorisOffresEmploiQueryModels(
  favorisIdsSql: FavoriOffreEmploiSqlModel[]
): FavoriOffreEmploiQueryModel[] {
  return favorisIdsSql.map(favori => {
    return {
      id: favori.idOffre,
      dateCreation: DateService.fromJSDateToISOString(favori.dateCreation),
      dateCandidature: favori.dateCandidature
        ? DateService.fromJSDateToISOString(favori.dateCandidature)
        : undefined
    }
  })
}
