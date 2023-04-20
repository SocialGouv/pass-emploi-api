import { Injectable } from '@nestjs/common'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { PreferencesJeuneQueryModel } from './query-models/jeunes.query-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetPreferencesJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetPreferencesJeuneQueryHandler extends QueryHandler<
  GetPreferencesJeuneQuery,
  Result<PreferencesJeuneQueryModel>
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetPreferencesJeuneQueryHandler')
  }

  async handle(
    query: GetPreferencesJeuneQuery
  ): Promise<Result<PreferencesJeuneQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      attributes: ['partageFavoris'],
      where: {
        id: query.idJeune
      }
    })

    return success({
      partageFavoris: jeuneSqlModel!.partageFavoris
    })
  }

  async authorize(
    query: GetPreferencesJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
