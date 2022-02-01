import { Authentification } from 'src/domain/authentification'
import {
  ConseillerDto,
  ConseillerSqlModel
} from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export function fromConseillerSqlToUtilisateur(
  conseillerSqlModel: ConseillerSqlModel
): Authentification.Utilisateur {
  return {
    id: conseillerSqlModel.id,
    prenom: conseillerSqlModel.prenom,
    nom: conseillerSqlModel.nom,
    email: conseillerSqlModel.email ? conseillerSqlModel.email : undefined,
    structure: conseillerSqlModel.structure,
    type: Authentification.Type.CONSEILLER,
    roles: []
  }
}

export function fromJeuneSqlToUtilisateur(
  jeuneSqlModel: JeuneSqlModel
): Authentification.Utilisateur {
  return {
    id: jeuneSqlModel.id,
    prenom: jeuneSqlModel.prenom,
    nom: jeuneSqlModel.nom,
    email: jeuneSqlModel.email ? jeuneSqlModel.email : undefined,
    structure: jeuneSqlModel.structure,
    type: Authentification.Type.JEUNE,
    roles: []
  }
}

export function toSqlConseillerUtilisateur(
  utilisateur: Authentification.Utilisateur,
  idUtilisateurAuth: string
): AsSql<ConseillerDto> {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email ? utilisateur.email : null,
    structure: utilisateur.structure,
    idAuthentification: idUtilisateurAuth
  }
}
