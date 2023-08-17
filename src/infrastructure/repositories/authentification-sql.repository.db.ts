import { Injectable, Logger } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Core, estPoleEmploiBRSA } from '../../domain/core'
import { KeycloakClient } from '../clients/keycloak-client'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'
import {
  fromConseillerSqlToUtilisateur,
  fromJeuneSqlToUtilisateur
} from './mappers/authentification.mappers'

@Injectable()
export class AuthentificationSqlRepository
  implements Authentification.Repository
{
  private logger: Logger

  constructor(private keycloakClient: KeycloakClient) {
    this.logger = new Logger('AuthentificationSqlRepository')
  }

  async get(
    idUtilisateurAuth: string,
    structure: Core.Structure,
    type: Authentification.Type
  ): Promise<Authentification.Utilisateur | undefined> {
    if (type === Authentification.Type.CONSEILLER) {
      const conseillerSqlModel = await ConseillerSqlModel.findOne({
        where: {
          idAuthentification: idUtilisateurAuth,
          structure: structure
        }
      })

      if (conseillerSqlModel) {
        const superviseursParEmail = await SuperviseurSqlModel.findAll({
          where: {
            email: conseillerSqlModel.email
          }
        })

        const estSuperviseur = estConseillerSuperviseur(
          superviseursParEmail,
          structure
        )
        const estSuperviseurPEBRSA = estConseillerSuperviseurPEBRSA(
          superviseursParEmail,
          structure,
          estSuperviseur
        )
        const roles = []

        if (estSuperviseur) {
          roles.push(Authentification.Role.SUPERVISEUR)
        }
        if (estSuperviseurPEBRSA) {
          roles.push(Authentification.Role.SUPERVISEUR_PE_BRSA)
        }
        return fromConseillerSqlToUtilisateur(conseillerSqlModel, roles)
      }
    } else if (Authentification.estJeune(type)) {
      const jeuneSqlModel = await JeuneSqlModel.findOne({
        where: {
          idAuthentification: idUtilisateurAuth,
          structure: structure
        }
      })

      if (jeuneSqlModel) {
        return fromJeuneSqlToUtilisateur(jeuneSqlModel)
      }
    }

    return undefined
  }

  async getJeuneByEmailEtStructure(
    email: string,
    structure: Core.Structure
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        email: email,
        structure
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async update(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (Authentification.Type.JEUNE === utilisateur.type) {
      await JeuneSqlModel.update(
        {
          idAuthentification: utilisateur.idAuthentification,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          dateDerniereConnexion: utilisateur.dateDerniereConnexion,
          datePremiereConnexion: utilisateur.datePremiereConnexion
        },
        { where: { id: utilisateur.id } }
      )
    } else if (Authentification.Type.CONSEILLER === utilisateur.type) {
      await ConseillerSqlModel.update(
        {
          idAuthentification: utilisateur.idAuthentification,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          dateDerniereConnexion: utilisateur.dateDerniereConnexion,
          datePremiereConnexion: utilisateur.datePremiereConnexion
        },
        { where: { id: utilisateur.id } }
      )
    }
  }

  async save(
    utilisateur: Authentification.Utilisateur,
    dateCreation?: Date
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await ConseillerSqlModel.upsert({
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email ? utilisateur.email : null,
        structure: utilisateur.structure,
        idAuthentification: utilisateur.idAuthentification,
        dateCreation: dateCreation ?? undefined,
        dateDerniereConnexion: utilisateur.dateDerniereConnexion
      })
    }
  }

  async updateJeune(
    utilisateur: Partial<Authentification.Utilisateur>
  ): Promise<void> {
    await JeuneSqlModel.update(
      {
        idAuthentification: utilisateur.idAuthentification
      },
      { where: { id: utilisateur.id } }
    )
  }

  async deleteUtilisateurIdp(idUtilisateur: string): Promise<void> {
    await this.keycloakClient.deleteUserByIdUser(idUtilisateur)
    this.logger.log(`Utilisateur ${idUtilisateur} supprimé de keycloak`)
  }
}

function estConseillerSuperviseur(
  superviseursParEmail: SuperviseurSqlModel[],
  structureDuConseiller: Core.Structure
): boolean {
  return Boolean(
    superviseursParEmail.find(
      superviseurParEmail =>
        superviseurParEmail.structure === structureDuConseiller
    )
  )
}

function estConseillerSuperviseurPEBRSA(
  superviseursParEmail: SuperviseurSqlModel[],
  structureDuConseiller: Core.Structure,
  estSuperviseur: boolean
): boolean {
  return (
    estPoleEmploiBRSA(structureDuConseiller) &&
    estSuperviseur &&
    Boolean(
      superviseursParEmail.find(
        superviseurParEmail =>
          superviseurParEmail.structure === Core.Structure.POLE_EMPLOI
      )
    ) &&
    Boolean(
      superviseursParEmail.find(
        superviseurParEmail =>
          superviseurParEmail.structure === Core.Structure.POLE_EMPLOI_BRSA
      )
    )
  )
}
