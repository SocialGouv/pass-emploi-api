import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

export function fromSqlToDetailJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): DetailJeuneQueryModel {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    creationDate: jeuneSqlModel.dateCreation.toISOString()
  }
}
