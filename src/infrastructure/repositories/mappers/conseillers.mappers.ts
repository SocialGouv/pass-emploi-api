import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { DetailConseillerQueryModel } from '../../../application/queries/query-models/conseillers.query-model'

export function fromSqlToDetailConseillerQueryModel(
  conseillerSqlModel: ConseillerSqlModel,
  aDesBeneficiairesARecuperer: boolean
): DetailConseillerQueryModel {
  const conseiller: DetailConseillerQueryModel = {
    id: conseillerSqlModel.id,
    firstName: conseillerSqlModel.prenom,
    lastName: conseillerSqlModel.nom,
    email: conseillerSqlModel.email ?? undefined,
    agence: conseillerSqlModel.agence ?? undefined,
    notificationsSonores: conseillerSqlModel.notificationsSonores,
    aDesBeneficiairesARecuperer: aDesBeneficiairesARecuperer
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
