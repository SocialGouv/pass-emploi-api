import { Injectable } from '@nestjs/common'
import {
  Conseiller,
  ConseillerEtSesJeunesQueryModel
} from '../../domain/conseiller'
import { NotFound } from '../../domain/erreur'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'

@Injectable()
export class ConseillerSqlRepository implements Conseiller.Repository {
  async get(id: string): Promise<Conseiller> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel) {
      throw new NotFound(id, 'Conseiller')
    }
    return {
      id: conseillerSqlModel.id,
      firstName: conseillerSqlModel.prenom,
      lastName: conseillerSqlModel.nom
    }
  }

  async save(conseiller: Conseiller): Promise<void> {
    await ConseillerSqlModel.upsert({
      id: conseiller.id,
      prenom: conseiller.firstName,
      nom: conseiller.lastName
    })
  }

  async getAvecJeunes(
    id: Conseiller.Id
  ): Promise<ConseillerEtSesJeunesQueryModel | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id, {
      include: [{ model: JeuneSqlModel }]
    })
    if (!conseillerSqlModel) return undefined

    return {
      conseiller: {
        id: conseillerSqlModel.id,
        firstName: conseillerSqlModel.prenom,
        lastName: conseillerSqlModel.nom
      },
      jeunes: conseillerSqlModel.jeunes.map(jeuneSqlModel => ({
        id: jeuneSqlModel.id,
        firstName: jeuneSqlModel.prenom,
        lastName: jeuneSqlModel.nom,
        creationDate: jeuneSqlModel.dateCreation.toISOString()
      }))
    }
  }
}
