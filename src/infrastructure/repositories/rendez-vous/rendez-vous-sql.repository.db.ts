import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { RendezVous } from '../../../domain/rendez-vous'
import { DateService } from '../../../utils/date-service'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../sequelize/models/rendez-vous-jeune-association.model'
import { RendezVousSqlModel } from '../../sequelize/models/rendez-vous.sql-model'
import { toRendezVous, toRendezVousDto } from '../mappers/rendez-vous.mappers'
import { SequelizeInjectionToken } from '../../sequelize/providers'

@Injectable()
export class RendezVousRepositorySql implements RendezVous.Repository {
  constructor(
    private dateService: DateService,
    @Inject(SequelizeInjectionToken)
    private readonly sequelize: Sequelize
  ) {}

  async save(rendezVous: RendezVous): Promise<void> {
    const rendezVousDto = toRendezVousDto(rendezVous)

    await this.sequelize.transaction(async transaction => {
      await RendezVousSqlModel.upsert(rendezVousDto, { transaction })
      await RendezVousJeuneAssociationSqlModel.destroy({
        transaction,
        where: {
          idRendezVous: rendezVous.id,
          idJeune: {
            [Op.notIn]: rendezVous.jeunes.map(jeune => jeune.id)
          }
        }
      })
      await Promise.all(
        rendezVous.jeunes.map(jeune =>
          RendezVousJeuneAssociationSqlModel.upsert(
            {
              idJeune: jeune.id,
              idRendezVous: rendezVous.id
            },
            { transaction }
          )
        )
      )
    })
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
    await RendezVousJeuneAssociationSqlModel.destroy({
      where: { idRendezVous: idRendezVous }
    })
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
      order: [['date', 'DESC']],
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
