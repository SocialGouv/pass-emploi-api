import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import {
  RendezVous,
  TYPES_ANIMATIONS_COLLECTIVES
} from '../../../domain/rendez-vous/rendez-vous'
import { DateService } from '../../../utils/date-service'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../sequelize/providers'
import { toRendezVous, toRendezVousDto } from '../mappers/rendez-vous.mappers'

@Injectable()
export class AnimationCollectiveSqlRepository
  implements RendezVous.AnimationCollective.Repository
{
  constructor(
    private dateService: DateService,
    @Inject(SequelizeInjectionToken)
    private readonly sequelize: Sequelize
  ) {}

  async getAllAVenirByEtablissement(
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
          [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
        }
      }
    })
    return rendezVousSql.map(
      rdvSql => toRendezVous(rdvSql) as RendezVous.AnimationCollective
    )
  }

  async getAllByEtablissementAvecSupprimes(
    idEtablissement: string
  ): Promise<RendezVous.AnimationCollective[]> {
    const rendezVousSql = await RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      order: [['date', 'DESC']],
      where: {
        idAgence: idEtablissement,
        type: {
          [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
        }
      }
    })
    return rendezVousSql.map(
      rdvSql => toRendezVous(rdvSql) as RendezVous.AnimationCollective
    )
  }

  async get(
    idEtablissement: string
  ): Promise<RendezVous.AnimationCollective | undefined> {
    const rendezVousSql = await RendezVousSqlModel.findOne({
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }],
      where: {
        id: idEtablissement,
        type: {
          [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
        }
      }
    })

    if (!rendezVousSql) {
      return undefined
    }

    return toRendezVous(rendezVousSql) as RendezVous.AnimationCollective
  }

  async save(
    animationCollective: RendezVous.AnimationCollective
  ): Promise<void> {
    const animationCollectiveDto = toRendezVousDto(animationCollective)

    await this.sequelize.transaction(async transaction => {
      await RendezVousSqlModel.upsert(animationCollectiveDto, { transaction })
      await RendezVousJeuneAssociationSqlModel.destroy({
        transaction,
        where: {
          idRendezVous: animationCollective.id,
          idJeune: {
            [Op.notIn]: animationCollective.jeunes.map(jeune => jeune.id)
          }
        }
      })
      await Promise.all(
        animationCollective.jeunes.map(jeune => {
          return RendezVousJeuneAssociationSqlModel.upsert(
            {
              idJeune: jeune.id,
              idRendezVous: animationCollective.id,
              present: jeune.present ?? null
            },
            { transaction }
          )
        })
      )
    })
  }
}
