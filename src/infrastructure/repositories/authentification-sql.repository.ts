import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { fromConseillerSqlToUtilisateur } from './mappers/authentification.mappers'

@Injectable()
export class AuthentificationSqlRepository
  implements Authentification.Repository
{
  async get(
    idUtilisateurAuth: string,
    type: Authentification.Type
  ): Promise<Authentification.Utilisateur | undefined> {
    if (type === Authentification.Type.CONSEILLER) {
      const conseillerSqlModel = await ConseillerSqlModel.findOne({
        where: {
          idAuthentification: idUtilisateurAuth
        }
      })

      if (conseillerSqlModel) {
        return fromConseillerSqlToUtilisateur(conseillerSqlModel)
      }
    }

    return undefined
  }
}
