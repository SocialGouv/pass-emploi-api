import { Injectable } from '@nestjs/common'
import { Agence } from '../../domain/agence'
import { AgenceQueryModel } from '../../application/queries/query-models/agence.query-models'
import { AgenceSqlModel } from '../sequelize/models/agence.sql-model'

@Injectable()
export class AgenceSqlRepository implements Agence.Repository {
  async getAllQueryModelsByStructure(
    structure: string
  ): Promise<AgenceQueryModel[]> {
    const sqlModels = await AgenceSqlModel.findAll({
      where: {
        structure: structure
      }
    })
    return sqlModels.map(sql => {
      return new AgenceQueryModel(sql.id, sql.nomAgence)
    })
  }
}
