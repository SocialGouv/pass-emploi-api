import { Injectable } from '@nestjs/common'
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

@Injectable()
export class AuthentificationSqlRepository
  implements Authentification.Repository
{
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

  async updateJeune(idJeune: string, idUtilisateurAuth: string): Promise<void> {
    await JeuneSqlModel.update(
      { idAuthentification: idUtilisateurAuth },
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
          prenom: utilisateur.prenom
        },
        { where: { id: utilisateur.id } }
      )
    } else if (Authentification.Type.CONSEILLER === utilisateur.type) {
      await ConseillerSqlModel.update(
        {
          idAuthentification: utilisateur.idAuthentification,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom
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
        dateCreation: dateCreation ?? undefined
      })
    }
  }
}
