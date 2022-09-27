import { Suggestion } from '../../../../../domain/offre/recherche/suggestion/suggestion'
import { Injectable } from '@nestjs/common'
import { SuggestionSqlModel } from '../../../../sequelize/models/suggestion.sql-model'
import { DateTime } from 'luxon'

@Injectable()
export class SuggestionSqlRepository implements Suggestion.Repository {
  async findAll(idJeune: string): Promise<Suggestion[]> {
    const suggestionsSql = await SuggestionSqlModel.findAll({
      where: {
        idJeune: idJeune
      }
    })
    return suggestionsSql.map(fromSqlToSuggestion)
  }

  async findByIdAndIdJeune(
    id: string,
    idJeune: string
  ): Promise<Suggestion | undefined> {
    const suggestionSql = await SuggestionSqlModel.findOne({
      where: {
        id,
        idJeune: idJeune
      }
    })
    if (!suggestionSql) {
      return undefined
    }
    return fromSqlToSuggestion(suggestionSql)
  }

  async save(suggestion: Suggestion): Promise<void> {
    await SuggestionSqlModel.upsert({
      id: suggestion.id,
      idJeune: suggestion.idJeune,
      idFonctionnel: suggestion.idFonctionnel,
      type: suggestion.type,
      source: suggestion.source,
      dateCreation: suggestion.dateCreation,
      dateMiseAJour: suggestion.dateMiseAJour,
      dateSuppression: suggestion.dateSuppression ?? null,
      dateCreationRecherche: suggestion.dateCreationRecherche ?? null,
      criteres: suggestion.criteres,
      titre: suggestion.informations.titre,
      metier: suggestion.informations.metier,
      localisation: suggestion.informations.localisation
    })
  }

  async delete(id: string): Promise<void> {
    await SuggestionSqlModel.destroy({
      where: {
        id: id
      }
    })
  }
}

function fromSqlToSuggestion(suggestionSql: SuggestionSqlModel): Suggestion {
  return {
    id: suggestionSql.id,
    idJeune: suggestionSql.idJeune,
    idFonctionnel: suggestionSql.idFonctionnel,
    type: suggestionSql.type,
    source: suggestionSql.source,
    dateCreation: DateTime.fromJSDate(suggestionSql.dateCreation).toUTC(),
    dateMiseAJour: DateTime.fromJSDate(suggestionSql.dateMiseAJour).toUTC(),
    dateSuppression: suggestionSql.dateSuppression
      ? DateTime.fromJSDate(suggestionSql.dateSuppression).toUTC()
      : undefined,
    dateCreationRecherche: suggestionSql.dateCreationRecherche
      ? DateTime.fromJSDate(suggestionSql.dateCreationRecherche).toUTC()
      : undefined,
    criteres: suggestionSql.criteres ?? undefined,
    informations: {
      titre: suggestionSql.titre,
      metier: suggestionSql.metier,
      localisation: suggestionSql.localisation
    }
  }
}
