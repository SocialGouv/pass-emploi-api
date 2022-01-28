import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel
} from '../../application/queries/query-models/rendez-vous.query-models'
import { RendezVous } from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import {
  toRendezVousDto,
  fromSqlToRendezVousConseillerQueryModel,
  fromSqlToRendezVousJeuneQueryModel,
  toRendezVous
} from './mappers/rendez-vous.mappers'

@Injectable()
export class RendezVousRepositorySql implements RendezVous.Repository {
  constructor(private dateService: DateService) {}

  async add(rendezVous: RendezVous): Promise<void> {
    const rendezVousDto = toRendezVousDto(rendezVous)
    await RendezVousSqlModel.upsert(rendezVousDto)
  }

  async delete(idRendezVous: string): Promise<void> {
    await RendezVousSqlModel.update(
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
    const rendezVousSql = await RendezVousSqlModel.findByPk(idRendezVous, {
      include: [
        JeuneSqlModel,
        { model: JeuneSqlModel, include: [ConseillerSqlModel] }
      ]
    })

    if (!rendezVousSql || rendezVousSql.dateSuppression) {
      return undefined
    }
    return toRendezVous(rendezVousSql)
  }

  async getAllAVenir(): Promise<RendezVous[]> {
    const maintenant = this.dateService.nowJs()
    const rendezVousSql = await RendezVousSqlModel.findAll({
      include: [
        JeuneSqlModel,
        { model: JeuneSqlModel, include: [ConseillerSqlModel] }
      ],
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

  async getAllQueryModelsByConseiller(
    idConseiller: string
  ): Promise<RendezVousConseillerQueryModel> {
    const maintenant = this.dateService.nowJs()

    const jeunesSql = await JeuneSqlModel.findAll({
      attributes: ['id'],
      where: {
        idConseiller
      }
    })
    const jeunesIds = jeunesSql.map(jeuneSql => jeuneSql.id)

    const rendezVousPassesPromise = RendezVousSqlModel.findAll({
      include: [JeuneSqlModel],
      where: {
        idJeune: { [Op.in]: jeunesIds },
        date: {
          [Op.lte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'DESC']]
    })

    const rendezVousFutursPromise = RendezVousSqlModel.findAll({
      include: [JeuneSqlModel],
      where: {
        idJeune: { [Op.in]: jeunesIds },
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']]
    })

    const [rendezVousPasses, rendezVousFuturs] = await Promise.all([
      rendezVousPassesPromise,
      rendezVousFutursPromise
    ])

    return {
      passes: rendezVousPasses.map(fromSqlToRendezVousConseillerQueryModel),
      futurs: rendezVousFuturs.map(fromSqlToRendezVousConseillerQueryModel)
    }
  }

  async getAllQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousQueryModel[]> {
    const allRendezVousSql = await RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      where: {
        idJeune,
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']]
    })

    return allRendezVousSql.map(fromSqlToRendezVousJeuneQueryModel)
  }
}
