import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { DetailJeuneQueryModel } from '../query-models/jeunes.query-models'

export function fromSqlToDetailJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): DetailJeuneQueryModel {
  const depuis =
    jeuneSqlModel.transferts!.length > 0
      ? jeuneSqlModel.transferts![0].dateTransfert
      : jeuneSqlModel.dateCreation
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    email: jeuneSqlModel.email ?? undefined,
    creationDate: jeuneSqlModel.dateCreation.toISOString(),
    isActivated: Boolean(jeuneSqlModel.idAuthentification),
    conseiller: {
      email: jeuneSqlModel.conseiller!.email ?? undefined,
      prenom: jeuneSqlModel.conseiller!.prenom,
      nom: jeuneSqlModel.conseiller!.nom,
      depuis: depuis.toISOString()
    },
    situations: jeuneSqlModel.situations?.situations
  }
}
