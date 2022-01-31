import { RechercheSqlModel } from '../../sequelize/models/recherche.sql-model'
import { RechercheQueryModel } from '../../../application/queries/query-models/recherches.query-model'

export function fromSqlToRechercheQueryModel(
  rechercheSql: RechercheSqlModel
): RechercheQueryModel {
  return {
    id: rechercheSql.id,
    titre: rechercheSql.titre,
    type: rechercheSql.type,
    metier: rechercheSql.metier === null ? undefined : rechercheSql.metier,
    localisation:
      rechercheSql.localisation === null
        ? undefined
        : rechercheSql.localisation,
    criteres: rechercheSql.criteres === null ? undefined : rechercheSql.criteres
  }
}
