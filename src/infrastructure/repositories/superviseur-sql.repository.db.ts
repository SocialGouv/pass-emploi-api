import { Injectable } from '@nestjs/common'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'
import { Superviseur } from '../../domain/superviseur'
import { emptySuccess, Result } from '../../building-blocks/types/result'

@Injectable()
export class SuperviseurSqlRepository implements Superviseur.Repository {
  async saveSuperviseurs(emails: string[]): Promise<Result> {
    await Promise.all(
      emails.map(email =>
        SuperviseurSqlModel.upsert({
          email: email.toLocaleLowerCase()
        })
      )
    )
    return emptySuccess()
  }

  async deleteSuperviseurs(emails: string[]): Promise<Result> {
    await Promise.all(
      emails.map(email =>
        SuperviseurSqlModel.destroy({
          where: {
            email: email.toLocaleLowerCase()
          }
        })
      )
    )
    return emptySuccess()
  }
}
