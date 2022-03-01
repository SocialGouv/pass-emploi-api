import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import { Superviseur } from 'src/domain/superviseur'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'

@Injectable()
export class SuperviseurSqlRepository implements Superviseur.Repository {
  async saveSuperviseurs(superviseurs: Superviseur[]): Promise<Result> {
    await Promise.all(
      superviseurs.map(superviseur =>
        SuperviseurSqlModel.upsert({
          email: superviseur.email.toLocaleLowerCase(),
          structure: superviseur.structure
        })
      )
    )
    return emptySuccess()
  }

  async deleteSuperviseurs(superviseurs: Superviseur[]): Promise<Result> {
    await Promise.all(
      superviseurs.map(superviseur =>
        SuperviseurSqlModel.destroy({
          where: {
            email: superviseur.email.toLocaleLowerCase(),
            structure: superviseur.structure
          }
        })
      )
    )
    return emptySuccess()
  }
}
