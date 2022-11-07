import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { CodeTypeRendezVous, RendezVous } from '../../../domain/rendez-vous'
import { DateService } from '../../../utils/date-service'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../sequelize/models/rendez-vous.sql-model'
import { toRendezVous, toRendezVousDto } from '../mappers/rendez-vous.mappers'
import { RendezVousJeuneAssociationSqlModel } from '../../sequelize/models/rendez-vous-jeune-association.model'
import { SequelizeInjectionToken } from '../../sequelize/providers'
import estUneAnimationCollective = RendezVous.estUneAnimationCollective

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
    return rendezVousSql.map(toRendezVous).filter(estUneAnimationCollective)
  }

  async save(
    animationCollective: RendezVous.AnimationCollective
  ): Promise<void> {
    const rendezVousDto = toRendezVousDto(animationCollective)

    await this.sequelize.transaction(async transaction => {
      await RendezVousSqlModel.upsert(rendezVousDto, { transaction })
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
        animationCollective.jeunes.map(jeune =>
          RendezVousJeuneAssociationSqlModel.upsert(
            {
              idJeune: jeune.id,
              idRendezVous: animationCollective.id
            },
            { transaction }
          )
        )
      )
    })
  }
}
