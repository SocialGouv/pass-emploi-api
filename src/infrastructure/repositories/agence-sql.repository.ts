import { Injectable } from '@nestjs/common'
import { Agence } from '../../domain/agence'
import { AgenceQueryModel } from '../../application/queries/query-models/agence.query-models'
import { AgenceSqlModel } from '../sequelize/models/agence.sql-model'
import { Core } from '../../domain/core'
import Structure = Core.Structure

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

  async get(id: string): Promise<Agence | undefined> {
    const agence = await AgenceSqlModel.findByPk(id)
    if (!agence) {
      return undefined
    }
    return agence
  }

  async getStructureOfAgence(id: string): Promise<Structure | undefined> {
    const agence = await AgenceSqlModel.findByPk(id)
    if (!agence) {
      return undefined
    }
    return agence.structure
  }
}
