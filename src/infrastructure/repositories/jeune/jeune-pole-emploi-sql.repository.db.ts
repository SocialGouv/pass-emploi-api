import { Op } from 'sequelize'
import { Core } from '../../../domain/core'
import { Jeune } from '../../../domain/jeune/jeune'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

export class JeunePoleEmploiSqlRepository
  implements Jeune.PoleEmploi.Repository
{
  async findAll(offset: number, limit: number): Promise<Jeune.PoleEmploi[]> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        structure: {
          [Op.in]: Core.structuresPoleEmploi
        },
        pushNotificationToken: { [Op.ne]: null },
        notificationsRendezVousSessions: true,
        idAuthentification: { [Op.ne]: null }
      },
      order: [['id', 'ASC']],
      offset,
      limit
    })

    return jeunesSqlModel.map(jeuneSql => {
      return {
        id: jeuneSql.id,
        idAuthentification: jeuneSql.idAuthentification,
        pushNotificationToken: jeuneSql.pushNotificationToken!
      }
    })
  }
}
