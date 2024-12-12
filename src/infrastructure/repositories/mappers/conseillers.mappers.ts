import { DetailConseillerQueryModel } from '../../../application/queries/query-models/conseillers.query-model'
import { ListeDeDiffusionQueryModel } from '../../../application/queries/query-models/liste-de-diffusion.query-model'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { ListeDeDiffusionSqlModel } from '../../sequelize/models/liste-de-diffusion.sql-model'

export function fromSqlToDetailConseillerQueryModel(
  conseillerSqlModel: ConseillerSqlModel,
  aDesBeneficiairesARecuperer: boolean
): DetailConseillerQueryModel {
  const conseiller: DetailConseillerQueryModel = {
    id: conseillerSqlModel.id,
    firstName: conseillerSqlModel.prenom,
    lastName: conseillerSqlModel.nom,
    email: conseillerSqlModel.email ?? undefined,
    dateSignatureCGU: conseillerSqlModel.dateSignatureCGU?.toISOString(),
    dateVisionnageActus: conseillerSqlModel.dateVisionnageActus?.toISOString(),
    agence: undefined,
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
  if (conseillerSqlModel.structureMilo) {
    conseiller.structureMilo = {
      id: conseillerSqlModel.structureMilo.id,
      nom: conseillerSqlModel.structureMilo.nomOfficiel
    }
  }
  return conseiller
}

export function fromSqlToListeDeDiffusionQueryModel(
  listeDeDiffusionSql: ListeDeDiffusionSqlModel
): ListeDeDiffusionQueryModel {
  return {
    id: listeDeDiffusionSql.id,
    titre: listeDeDiffusionSql.titre,
    dateDeCreation: listeDeDiffusionSql.dateDeCreation,
    beneficiaires: listeDeDiffusionSql.jeunes.map(beneficiaire => ({
      id: beneficiaire.id,
      nom: beneficiaire.nom,
      prenom: beneficiaire.prenom,
      estDansLePortefeuille:
        beneficiaire.idConseiller === listeDeDiffusionSql.idConseiller
    }))
  }
}
