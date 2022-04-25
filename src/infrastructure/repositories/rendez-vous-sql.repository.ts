import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { RendezVous } from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModelOld } from '../sequelize/models/rendez-vous.sql-model'
import { toRendezVous, toRendezVousDto } from './mappers/rendez-vous.mappers'

@Injectable()
export class RendezVousRepositorySql implements RendezVous.Repository {
  constructor(private dateService: DateService) {}

  async save(rendezVous: RendezVous): Promise<void> {
    const RendezVousDtoOld = toRendezVousDto(rendezVous)
    await RendezVousSqlModelOld.upsert(RendezVousDtoOld)
  }

  async delete(idRendezVous: string): Promise<void> {
    await RendezVousSqlModelOld.update(
      {
        dateSuppression: this.dateService.nowJs()
      },
      {
        where: {
          id: idRendezVous
        }
      }
    )
  }

  async get(idRendezVous: string): Promise<RendezVous | undefined> {
    const rendezVousSql = await RendezVousSqlModelOld.findByPk(idRendezVous, {
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
    })

    if (!rendezVousSql || rendezVousSql.dateSuppression) {
      return undefined
    }
    return toRendezVous(rendezVousSql)
  }

  async getAllAVenir(): Promise<RendezVous[]> {
    const maintenant = this.dateService.nowJs()
    const rendezVousSql = await RendezVousSqlModelOld.findAll({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      where: {
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      }
    })
    return rendezVousSql.map(toRendezVous)
  }
}
