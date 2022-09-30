import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { Injectable } from '@nestjs/common'
import { SuggestionQueryModel } from './query-models/suggestion.query-model'
import { SuggestionSqlModel } from '../../infrastructure/sequelize/models/suggestion.sql-model'

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
        idJeune: query.idJeune
      }
    })
    return suggestionsSql
      .filter(suggestionSql => !suggestionSqlEstTraitee(suggestionSql))
      .map(suggestionSql => ({
        id: suggestionSql.id,
        titre: suggestionSql.titre,
        type: suggestionSql.type,
        metier: suggestionSql.metier,
        localisation: suggestionSql.localisation,
        dateCreation: suggestionSql.dateCreation.toISOString(),
        dateMiseAJour: suggestionSql.dateMiseAJour.toISOString()
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

function suggestionSqlEstTraitee(suggestionSql: SuggestionSqlModel): boolean {
  return Boolean(suggestionSql.dateCreationRecherche || suggestionSql.dateRefus)
}
