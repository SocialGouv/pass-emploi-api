import { Injectable, Logger } from '@nestjs/common'
import { Sequelize } from 'sequelize-typescript'
import { Authentification } from '../../domain/authentification'
import { Core, estMilo, getStructureDeReference } from '../../domain/core'
import { KeycloakClient } from '../clients/keycloak-client.db'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'
import {
  fromConseillerSqlToUtilisateur,
  fromJeuneSqlToUtilisateur
} from './mappers/authentification.mappers'
import { Op } from 'sequelize'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthentificationSqlRepository
  implements Authentification.Repository
{
  private logger: Logger

  constructor(
    private keycloakClient: KeycloakClient,
    private readonly configService: ConfigService
  ) {
    this.logger = new Logger('AuthentificationSqlRepository')
  }

  async getConseiller(
    idUtilisateurAuth: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      where: {
        idAuthentification: idUtilisateurAuth
      }
    })

    if (conseillerSqlModel) {
      const roles = []
      const estSuperviseur = await this.estConseillerSuperviseur(
        conseillerSqlModel.structure,
        conseillerSqlModel.email
      )
      if (estSuperviseur.dansSaStructure)
        roles.push(Authentification.Role.SUPERVISEUR)
      if (estSuperviseur.crossStructures)
        roles.push(Authentification.Role.SUPERVISEUR_RESPONSABLE)

      return fromConseillerSqlToUtilisateur(conseillerSqlModel, roles)
    }

    return undefined
  }

  async getJeuneByStructure(
    idUtilisateurAuth: string,
    structure: Core.Structure
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        idAuthentification: idUtilisateurAuth,
        structure
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async getJeuneByIdAuthentification(
    idUtilisateurAuth: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        idAuthentification: idUtilisateurAuth
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async getJeuneById(
    id: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(id)

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async getJeuneByEmail(
    email: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        email: email
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
          username: utilisateur.username,
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
        email: utilisateur.email ?? null,
        username: utilisateur.username ?? null,
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

  async deleteUtilisateurIdp(idUserCEJ: string): Promise<void> {
    try {
      await this.keycloakClient.deleteAccount(idUserCEJ)
    } catch (_e) {}
    this.logger.log(`Utilisateur ${idUserCEJ} supprimé de OIDC SSO`)
  }

  async estConseillerSuperviseur(
    structure: Core.Structure,
    email?: string | null
  ): Promise<{ dansSaStructure: boolean; crossStructures: boolean }> {
    if (estMilo(structure))
      return { dansSaStructure: true, crossStructures: false }
    if (!email) return { dansSaStructure: false, crossStructures: false }

    const superviseursParEmail = await SuperviseurSqlModel.findAll({
      where: { email: { [Op.like]: `${email.split('@')[0]}%` } },
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('structure')), 'structure']
      ]
    })

    return {
      dansSaStructure: checkEstSuperviseur(superviseursParEmail, structure),
      crossStructures: checkEstSuperviseurResponsable(
        superviseursParEmail,
        structure
      )
    }
  }
}

function checkEstSuperviseur(
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

function checkEstSuperviseurResponsable(
  superviseursParEmail: SuperviseurSqlModel[],
  structureDuConseiller: Core.Structure
): boolean {
  const structureDeReference = getStructureDeReference(structureDuConseiller)

  return (
    superviseursParEmail.filter(
      ({ structure }) =>
        getStructureDeReference(structure) === structureDeReference
    ).length > 1
  )
}
