import { RechercheSqlModel } from 'src/infrastructure/sequelize/models/recherche.sql-model'
import { Recherche } from '../../../domain/offre/recherche/recherche'
import { RechercheQueryModel } from '../query-models/recherches.query-model'

export function toRechercheQueryModel(
  recherche: Recherche
): RechercheQueryModel {
  return {
    id: recherche.id,
    titre: recherche.titre,
    type: recherche.type,
    metier: recherche.metier,
    localisation: recherche.localisation,
    criteres: recherche.criteres
  }
}

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
