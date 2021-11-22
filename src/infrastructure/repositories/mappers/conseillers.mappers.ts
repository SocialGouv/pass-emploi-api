import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

export function fromSqlToDetailConseillerQueryModel(
  conseillerSqlModel: ConseillerSqlModel
): DetailConseillerQueryModel {
  return {
    id: conseillerSqlModel.id,
    firstName: conseillerSqlModel.prenom,
    lastName: conseillerSqlModel.nom
  }
}
