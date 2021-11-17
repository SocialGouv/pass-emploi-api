import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'

export async function fromSqlToDetailJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): Promise<DetailJeuneQueryModel> {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom
  }
}
