import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

export function fromSqlToDetailConseillerQueryModel(
  conseillerSqlModel: ConseillerSqlModel
): DetailConseillerQueryModel {
  const conseiller: DetailConseillerQueryModel = {
    id: conseillerSqlModel.id,
    firstName: conseillerSqlModel.prenom,
    lastName: conseillerSqlModel.nom,
    email: conseillerSqlModel.email ?? undefined,
    agence: conseillerSqlModel.agence ?? undefined,
    notificationsSonores: conseillerSqlModel.notificationsSonores
  }
  if (conseillerSqlModel.agence) {
    conseiller.agence = {
      id: conseillerSqlModel.agence.id,
      nom: conseillerSqlModel.agence.nomAgence
    }
  } else if (conseillerSqlModel.nomManuelAgence) {
    conseiller.agence = {
      id: undefined,
      nom: conseillerSqlModel.nomManuelAgence
    }
  }
  return conseiller
}
