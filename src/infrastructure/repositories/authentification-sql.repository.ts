import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import {
  fromConseillerSqlToUtilisateur,
  fromJeuneSqlToUtilisateur,
  toSqlConseillerUtilisateur
} from './mappers/authentification.mappers'

@Injectable()
export class AuthentificationSqlRepository
  implements Authentification.Repository
{
  async get(
    idUtilisateurAuth: string,
    structure: Authentification.Structure,
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
        return fromConseillerSqlToUtilisateur(conseillerSqlModel)
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

  async getJeuneMiloByEmail(
    email: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        email: email,
        structure: Authentification.Structure.MILO
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async updateJeuneMilo(
    idJeune: string,
    idUtilisateurAuth: string
  ): Promise<void> {
    await JeuneSqlModel.update(
      { idAuthentification: idUtilisateurAuth },
      { where: { id: idJeune } }
    )
  }

  async save(
    utilisateur: Authentification.Utilisateur,
    idUtilisateurAuth: string
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await ConseillerSqlModel.creer(
        toSqlConseillerUtilisateur(utilisateur, idUtilisateurAuth)
      )
    }
  }
}
