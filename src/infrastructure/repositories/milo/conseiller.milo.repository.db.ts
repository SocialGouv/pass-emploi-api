import { Injectable } from '@nestjs/common'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'

@Injectable()
export class ConseillerMiloSqlRepository implements Conseiller.Milo.Repository {
  async get(id: string): Promise<Conseiller.Milo | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(id)
    if (!conseillerSqlModel || !conseillerSqlModel.idStructureMilo) {
      return undefined
    }
    return {
      idStructure: conseillerSqlModel.idStructureMilo
    }
  }
}
