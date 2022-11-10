import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { CodeTypeRendezVous, RendezVous } from '../../../domain/rendez-vous'
import { DateService } from '../../../utils/date-service'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../sequelize/providers'
import { toRendezVous } from '../mappers/rendez-vous.mappers'

@Injectable()
export class AnimationCollectiveSqlRepository
  implements RendezVous.AnimationCollective.Repository
{
  constructor(
    private dateService: DateService,
    @Inject(SequelizeInjectionToken)
    private readonly sequelize: Sequelize
  ) {}

  async getAllAVenir(
    idEtablissement: string
  ): Promise<RendezVous.AnimationCollective[]> {
    const maintenant = this.dateService.nowJs()
    const rendezVousSql = await RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      order: [['date', 'DESC']],
      where: {
        date: {
          [Op.gte]: maintenant
        },
        idAgence: idEtablissement,
        type: {
          [Op.in]: [
            CodeTypeRendezVous.INFORMATION_COLLECTIVE,
            CodeTypeRendezVous.ATELIER
          ]
        },
        dateSuppression: {
          [Op.is]: null
        }
      }
    })
    return rendezVousSql.map(
      rdvSql => toRendezVous(rdvSql) as RendezVous.AnimationCollective
    )
  }
}
