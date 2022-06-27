import { Injectable } from '@nestjs/common'
import { Agence } from '../../domain/agence'
import { AgenceSqlModel } from '../sequelize/models/agence.sql-model'
import { Core } from '../../domain/core'
import Structure = Core.Structure

@Injectable()
export class AgenceSqlRepository implements Agence.Repository {
  async get(id: string, structure: Structure): Promise<Agence | undefined> {
    const agenceSql = await AgenceSqlModel.findOne({
      where: {
        id: id,
        structure: structure
      }
    })
    if (!agenceSql) {
      return undefined
    }
    return {
      id: agenceSql.id,
      nom: agenceSql.nomAgence
    }
  }
}
