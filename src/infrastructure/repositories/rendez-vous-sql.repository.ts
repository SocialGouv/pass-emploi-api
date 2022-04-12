import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel,
  TypesRendezVousQueryModel
} from '../../application/queries/query-models/rendez-vous.query-models'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import {
  fromSqlToRendezVousConseillerQueryModel,
  fromSqlToRendezVousJeuneQueryModel,
  fromSqlToRendezVousQueryModel,
  toRendezVous,
  toRendezVousDto
} from './mappers/rendez-vous.mappers'

@Injectable()
export class RendezVousRepositorySql implements RendezVous.Repository {
  constructor(private dateService: DateService) {}

  async getQueryModelById(
    id: string
  ): Promise<RendezVousQueryModel | undefined> {
    const rendezVousSqlModel = await RendezVousSqlModel.findByPk(id, {
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })
    if (!rendezVousSqlModel) return undefined

    return fromSqlToRendezVousQueryModel(rendezVousSqlModel)
  }

  async save(rendezVous: RendezVous): Promise<void> {
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
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
    })

    if (!rendezVousSql || rendezVousSql.dateSuppression) {
      return undefined
    }
    return toRendezVous(rendezVousSql)
  }

  async getAllAVenir(): Promise<RendezVous[]> {
    const maintenant = this.dateService.nowJs()
    const rendezVousSql = await RendezVousSqlModel.findAll({
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

  async getAllQueryModelsByConseiller(
    idConseiller: string,
    presenceConseiller?: boolean
  ): Promise<RendezVousConseillerQueryModel> {
    const maintenant = this.dateService.nowJs()

    const presenceConseillerCondition: { presenceConseiller?: boolean } = {}
    if (presenceConseiller !== undefined) {
      presenceConseillerCondition.presenceConseiller = presenceConseiller
    }

    const rendezVousPassesPromise = RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, where: { idConseiller } }],
      where: {
        date: {
          [Op.lte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        },
        ...presenceConseillerCondition
      },
      order: [['date', 'DESC']]
    })

    const rendezVousFutursPromise = RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, where: { idConseiller } }],
      where: {
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        },
        ...presenceConseillerCondition
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

  getTypesRendezVousQueryModel(): TypesRendezVousQueryModel {
    return Object.values(CodeTypeRendezVous).map(code => {
      return { code, label: mapCodeLabelTypeRendezVous[code] }
    })
  }

  async getRendezVousPassesQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousQueryModel[]> {
    const maintenant = this.dateService.nowJs()
    const rendezVousSqlAfter = await RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      where: {
        idJeune,
        date: {
          [Op.lt]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'DESC']]
    })

    return rendezVousSqlAfter.map(fromSqlToRendezVousJeuneQueryModel)
  }

  async getRendezVousFutursQueryModelsByJeune(
    idJeune: string
  ): Promise<RendezVousQueryModel[]> {
    const maintenant = this.dateService.nowJs()
    const rendezVousSqlBefore = await RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      where: {
        idJeune,
        date: {
          [Op.gte]: maintenant
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']]
    })

    return rendezVousSqlBefore.map(fromSqlToRendezVousJeuneQueryModel)
  }
}
