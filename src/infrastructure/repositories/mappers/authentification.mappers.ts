import { Authentification } from 'src/domain/authentification'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

export function fromConseillerSqlToUtilisateur(
  conseillerSqlModel: ConseillerSqlModel
): Authentification.Utilisateur {
  return {
    id: conseillerSqlModel.id,
    prenom: conseillerSqlModel.prenom,
    nom: conseillerSqlModel.nom,
    email: conseillerSqlModel.email ? conseillerSqlModel.email : undefined,
    structure: conseillerSqlModel.structure,
    type: Authentification.Type.CONSEILLER
  }
}
