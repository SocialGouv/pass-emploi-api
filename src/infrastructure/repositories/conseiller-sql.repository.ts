import { Injectable } from '@nestjs/common'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { Conseiller } from '../../domain/conseiller'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { fromSqlToDetailConseillerQueryModel } from './mappers/conseillers.mappers'

@Injectable()
export class ConseillerSqlRepository implements Conseiller.Repository {
  async get(id: string): Promise<Conseiller | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel) {
      return undefined
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

  async getQueryModelById(
    id: Conseiller.Id
  ): Promise<DetailConseillerQueryModel | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel) {
      return undefined
    }

    return fromSqlToDetailConseillerQueryModel(conseillerSqlModel)
  }
}
