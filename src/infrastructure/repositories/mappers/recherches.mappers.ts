import { RechercheSqlModel } from '../../sequelize/models/recherche.sql-model'
import { Recherche } from '../../../domain/offre/recherche/recherche'
import { DateTime } from 'luxon'

export function fromSqlToRecherche(rechercheSql: RechercheSqlModel): Recherche {
  return {
    id: rechercheSql.id,
    titre: rechercheSql.titre,
    type: rechercheSql.type,
    metier: rechercheSql.metier ?? undefined,
    localisation: rechercheSql.localisation ?? undefined,
    criteres: rechercheSql.criteres ?? undefined,
    idJeune: rechercheSql.idJeune,
    dateCreation: DateTime.fromJSDate(rechercheSql.dateCreation),
    dateDerniereRecherche: DateTime.fromJSDate(
      rechercheSql.dateDerniereRecherche
    ),
    etat: rechercheSql.etatDerniereRecherche
  }
}
