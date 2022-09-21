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
    return suggestionsSql.map(suggestionSql => {
      return {
        id: suggestionSql.id,
        idJeune: suggestionSql.idJeune,
        idFonctionnel: suggestionSql.idFonctionnel,
        type: suggestionSql.type,
        source: suggestionSql.source,
        dateCreation: DateTime.fromJSDate(suggestionSql.dateCreation).toUTC(),
        dateMiseAJour: DateTime.fromJSDate(suggestionSql.dateMiseAJour).toUTC(),
        criteres: suggestionSql.criteres,
        informations: {
          titre: suggestionSql.titre,
          metier: suggestionSql.metier,
          localisation: suggestionSql.localisation
        }
      }
    })
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
