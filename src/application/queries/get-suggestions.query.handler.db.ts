import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { Injectable } from '@nestjs/common'
import { SuggestionQueryModel } from './query-models/suggestion.query-model'
import { SuggestionSqlModel } from '../../infrastructure/sequelize/models/suggestion.sql-model'
import { Op } from 'sequelize'
import { DateTime } from 'luxon'

export interface GetSuggestionsQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetSuggestionsQueryHandler extends QueryHandler<
  GetSuggestionsQuery,
  SuggestionQueryModel[]
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetSuggestionsQueryHandler')
  }

  async handle(query: GetSuggestionsQuery): Promise<SuggestionQueryModel[]> {
    const suggestionsSql = await SuggestionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateCreationRecherche: {
          [Op.eq]: null
        },
        dateRefus: {
          [Op.eq]: null
        }
      }
    })
    return suggestionsSql.map(suggestionSql => ({
      id: suggestionSql.id,
      titre: suggestionSql.titre,
      type: suggestionSql.type,
      metier: suggestionSql.metier,
      localisation: suggestionSql.localisation,
      dateCreation: DateTime.fromJSDate(suggestionSql.dateCreation).toISO(),
      dateRafraichissement: DateTime.fromJSDate(
        suggestionSql.dateRafraichissement
      ).toISO()
    }))
  }

  async monitor(): Promise<void> {
    return
  }

  authorize(
    query: GetSuggestionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }
}
