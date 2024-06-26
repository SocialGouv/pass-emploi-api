import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Injectable } from '@nestjs/common'
import { SuggestionQueryModel } from './query-models/suggestion.query-model'
import { SuggestionSqlModel } from '../../infrastructure/sequelize/models/suggestion.sql-model'
import { Op } from 'sequelize'
import { DateService } from '../../utils/date-service'
import { Suggestion } from 'src/domain/offre/recherche/suggestion/suggestion'

export interface GetSuggestionsQuery extends Query {
  idJeune: string
  avecDiagoriente: boolean
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
    const sources = query.avecDiagoriente
      ? [
          Suggestion.Source.POLE_EMPLOI,
          Suggestion.Source.CONSEILLER,
          Suggestion.Source.DIAGORIENTE
        ]
      : [Suggestion.Source.POLE_EMPLOI, Suggestion.Source.CONSEILLER]

    const suggestionsSql = await SuggestionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateCreationRecherche: {
          [Op.eq]: null
        },
        dateRefus: {
          [Op.eq]: null
        },
        source: sources
      }
    })
    return suggestionsSql.map(suggestionSql => ({
      id: suggestionSql.id,
      titre: suggestionSql.titre,
      type: suggestionSql.type,
      source: suggestionSql.source,
      metier: suggestionSql.metier ?? undefined,
      localisation: suggestionSql.localisation ?? undefined,
      dateCreation: DateService.fromJSDateToISOString(
        suggestionSql.dateCreation
      ),
      dateRafraichissement: DateService.fromJSDateToISOString(
        suggestionSql.dateRafraichissement
      )
    }))
  }

  async monitor(): Promise<void> {
    return
  }

  authorize(
    query: GetSuggestionsQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }
}
