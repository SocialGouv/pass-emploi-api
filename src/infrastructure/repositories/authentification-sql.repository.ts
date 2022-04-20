import { Injectable, Logger } from '@nestjs/common'
import { Op } from 'sequelize'
import { Authentification } from 'src/domain/authentification'
import { Core } from '../../domain/core'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import {
  fromConseillerSqlToUtilisateur,
  fromJeuneSqlToUtilisateur
} from './mappers/authentification.mappers'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'
import { KeycloakClient } from '../clients/keycloak-client'

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
        const estSuperviseur = await SuperviseurSqlModel.findOne({
          where: {
            email: conseillerSqlModel.email,
            structure: conseillerSqlModel.structure
          }
        })

        if (estSuperviseur) {
          return fromConseillerSqlToUtilisateur(conseillerSqlModel, [
            Authentification.Role.SUPERVISEUR
          ])
        } else {
          return fromConseillerSqlToUtilisateur(conseillerSqlModel)
        }
      }
    } else if (type === Authentification.Type.JEUNE) {
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

  async getJeuneByEmail(
    email: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        email: email,
        structure: {
          [Op.or]: [Core.Structure.MILO, Core.Structure.POLE_EMPLOI]
        }
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async updateJeunePremiereConnexion(
    idJeune: string,
    nom: string,
    prenom: string,
    idUtilisateurAuth: string,
    datePremiereConnexion: Date
  ): Promise<void> {
    await JeuneSqlModel.update(
      {
        idAuthentification: idUtilisateurAuth,
        nom,
        prenom,
        datePremiereConnexion,
        dateDerniereConnexion: datePremiereConnexion
      },
      { where: { id: idJeune } }
    )
  }

  async update(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (Authentification.Type.JEUNE === utilisateur.type) {
      await JeuneSqlModel.update(
        {
          idAuthentification: utilisateur.idAuthentification,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          dateDerniereConnexion: utilisateur.dateDerniereConnexion
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
          dateDerniereConnexion: utilisateur.dateDerniereConnexion
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

  async deleteJeuneIdp(idJeune: string): Promise<void> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(idJeune)

    if (jeuneSqlModel) {
      const idAuthentification = jeuneSqlModel.idAuthentification
      await this.keycloakClient.deleteUserByIdAuthentification(
        idAuthentification
      )
      this.logger.log(`jeune ${idJeune} supprimé`)
    } else {
      this.logger.error(`jeune ${idJeune} non trouvé`)
    }
  }
}
