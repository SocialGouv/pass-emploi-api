import { Authentification } from '../../../domain/authentification'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

export function fromConseillerSqlToUtilisateur(
  conseillerSqlModel: ConseillerSqlModel,
  roles: Authentification.Role[] = []
): Authentification.Utilisateur {
  return {
    id: conseillerSqlModel.id,
    idAuthentification: conseillerSqlModel.idAuthentification,
    prenom: conseillerSqlModel.prenom,
    nom: conseillerSqlModel.nom,
    email: conseillerSqlModel.email ? conseillerSqlModel.email : undefined,
    username: conseillerSqlModel.username || undefined,
    structure: conseillerSqlModel.structure,
    type: Authentification.Type.CONSEILLER,
    dateDerniereConnexion:
      conseillerSqlModel.dateDerniereConnexion ?? undefined,
    datePremiereConnexion: conseillerSqlModel.dateCreation || undefined,
    roles
  }
}

export function fromJeuneSqlToUtilisateur(
  jeuneSqlModel: JeuneSqlModel
): Authentification.Utilisateur {
  return {
    id: jeuneSqlModel.id,
    idAuthentification: jeuneSqlModel.idAuthentification,
    prenom: jeuneSqlModel.prenom,
    nom: jeuneSqlModel.nom,
    email: jeuneSqlModel.email ? jeuneSqlModel.email : undefined,
    structure: jeuneSqlModel.structure,
    type: Authentification.Type.JEUNE,
    dateDerniereConnexion: jeuneSqlModel.dateDerniereConnexion || undefined,
    datePremiereConnexion: jeuneSqlModel.datePremiereConnexion || undefined,
    roles: []
  }
}
