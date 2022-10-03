import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Suggestion } from '../../../../../domain/offre/recherche/suggestion/suggestion'
import { SuggestionSqlModel } from '../../../../sequelize/models/suggestion.sql-model'

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

  async get(id: string): Promise<Suggestion | undefined> {
    const suggestionSql = await SuggestionSqlModel.findByPk(id)
    if (!suggestionSql) {
      return undefined
    }
    return fromSqlToSuggestion(suggestionSql)
  }

  async save(suggestion: Suggestion): Promise<void> {
    await SuggestionSqlModel.upsert({
      id: suggestion.id,
      idJeune: suggestion.idJeune,
      idFonctionnel: Buffer.from(
        JSON.stringify(suggestion.idFonctionnel)
      ).toString('base64'),
      type: suggestion.type,
      source: suggestion.source,
      dateCreation: suggestion.dateCreation,
      dateRafraichissement: suggestion.dateRafraichissement,
      dateRefus: suggestion.dateRefus ?? null,
      dateCreationRecherche: suggestion.dateCreationRecherche ?? null,
      idRecherche: suggestion.idRecherche ?? null,
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
    idFonctionnel: JSON.parse(
      Buffer.from(suggestionSql.idFonctionnel, 'base64').toString()
    ),
    type: suggestionSql.type,
    source: suggestionSql.source,
    dateCreation: DateTime.fromJSDate(suggestionSql.dateCreation).toUTC(),
    dateRafraichissement: DateTime.fromJSDate(
      suggestionSql.dateRafraichissement
    ).toUTC(),
    dateRefus: suggestionSql.dateRefus
      ? DateTime.fromJSDate(suggestionSql.dateRefus).toUTC()
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
