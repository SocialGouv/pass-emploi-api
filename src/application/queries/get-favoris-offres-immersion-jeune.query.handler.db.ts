import { Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune } from '../../domain/jeune/jeune'
import { FavoriOffreImmersionSqlModel } from '../../infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { FavoriOffreImmersionQueryModel } from './query-models/offres-immersion.query-model'

export interface GetFavorisOffresImmersionJeuneQuery extends Query {
  idJeune: Jeune.Id
}

@Injectable()
export class GetFavorisOffresImmersionJeuneQueryHandler extends QueryHandler<
  GetFavorisOffresImmersionJeuneQuery,
  FavoriOffreImmersionQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetFavorisOffresImmersionJeuneQueryHandler')
  }

  handle(
    query: GetFavorisOffresImmersionJeuneQuery
  ): Promise<FavoriOffreImmersionQueryModel[]> {
    return this.getFavorisQueryModelsByJeune(query.idJeune)
  }

  async authorize(
    query: GetFavorisOffresImmersionJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  private async getFavorisQueryModelsByJeune(
    idJeune: string
  ): Promise<FavoriOffreImmersionQueryModel[]> {
    const favorisIdsSql = await FavoriOffreImmersionSqlModel.findAll({
      attributes: ['idOffre', 'dateCandidature'],
      where: {
        idJeune
      },
      order: [['date_creation', 'DESC']]
    })

    return fromSqlToFavorisOffresImmersionQueryModels(favorisIdsSql)
  }
}

export function fromSqlToFavorisOffresImmersionQueryModels(
  favorisIdsSql: FavoriOffreImmersionSqlModel[]
): FavoriOffreImmersionQueryModel[] {
  return favorisIdsSql.map(favori => {
    return {
      id: favori.idOffre,
      dateCandidature: favori.dateCandidature
        ? DateService.fromJSDateToISOString(favori.dateCandidature)
        : undefined
    }
  })
}
