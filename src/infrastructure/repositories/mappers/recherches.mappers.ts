import { RechercheSqlModel } from '../../sequelize/models/recherche.sql-model'
import { RechercheQueryModel } from '../../../application/queries/query-models/recherches.query-model'
import { Recherche } from '../../../domain/recherche'
import { DateTime } from 'luxon'

export function fromSqlToRechercheQueryModel(
  rechercheSql: RechercheSqlModel
): RechercheQueryModel {
  return {
    id: rechercheSql.id,
    titre: rechercheSql.titre,
    type: rechercheSql.type,
    metier: rechercheSql.metier ?? undefined,
    localisation: rechercheSql.localisation ?? undefined,
    criteres: rechercheSql.criteres ?? undefined,
    geometrie: rechercheSql.geometrie ?? undefined
  }
}

export function fromSqlToRecherche(rechercheSql: RechercheSqlModel): Recherche {
  return {
    id: rechercheSql.id,
    titre: rechercheSql.titre,
    type: rechercheSql.type,
    metier: rechercheSql.metier ?? undefined,
    localisation: rechercheSql.localisation ?? undefined,
    criteres: rechercheSql.criteres ?? undefined,
    idJeune: rechercheSql.idJeune,
    dateCreation: DateTime.fromJSDate(rechercheSql.dateCreation).toUTC(),
    dateDerniereRecherche: DateTime.fromJSDate(
      rechercheSql.dateDerniereRecherche
    ).toUTC(),
    etat: rechercheSql.etatDerniereRecherche
  }
}
