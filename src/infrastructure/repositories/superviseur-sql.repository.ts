import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import { Superviseur } from 'src/domain/superviseur'
import { IdService } from 'src/utils/id-service'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'

@Injectable()
export class SuperviseurSqlRepository implements Superviseur.Repository {
  constructor(private idService: IdService) {}

  async saveSuperviseurs(superviseurs: Superviseur[]): Promise<Result> {
    await SuperviseurSqlModel.bulkCreate(
      superviseurs.map(superviseur => {
        return {
          id: this.idService.uuid(),
          email: superviseur.email,
          structure: superviseur.structure
        }
      })
    )
    return emptySuccess()
  }
  async deleteSuperviseurs(superviseurs: Superviseur[]): Promise<Result> {
    superviseurs.forEach(async superviseur => {
      await SuperviseurSqlModel.destroy({
        where: {
          email: superviseur.email,
          structure: superviseur.structure
        }
      })
    })
    return emptySuccess()
  }
}
