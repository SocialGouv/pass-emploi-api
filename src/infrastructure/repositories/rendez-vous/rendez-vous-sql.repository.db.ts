import { Inject, Injectable } from '@nestjs/common'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { RendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { DateService } from '../../../utils/date-service'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../sequelize/models/rendez-vous-jeune-association.sql-model'
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
    await RendezVousSqlModel.destroy({
      where: {
        id: idRendezVous
      }
    })
    await RendezVousJeuneAssociationSqlModel.destroy({
      where: { idRendezVous: idRendezVous }
    })
  }

  async get(idRendezVous: string): Promise<RendezVous | undefined> {
    const rendezVousSql = await RendezVousSqlModel.findByPk(idRendezVous, {
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
    })

    if (!rendezVousSql) {
      return undefined
    }
    return toRendezVous(rendezVousSql)
  }

  async getByIdPartenaire(
    idRendezVousPartenaire: string,
    typeRendezVousPartenaire: string
  ): Promise<RendezVous | undefined> {
    const rendezVousSql = await RendezVousSqlModel.findOne({
      where: {
        idPartenaire: idRendezVousPartenaire,
        typePartenaire: typeRendezVousPartenaire
      },
      include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
    })

    if (!rendezVousSql) {
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
        }
      }
    })
    return rendezVousSql.map(toRendezVous)
  }

  async getAndIncrementRendezVousIcsSequence(
    idRendezVous: string
  ): Promise<number | undefined> {
    const rendezVousIcsSequence = await this.sequelize.query(
      ` UPDATE rendez_vous SET ics_sequence = CASE 
            WHEN ics_sequence IS NOT NULL THEN ics_sequence + 1 ELSE 0 END 
            WHERE id = :idRendezVous
            RETURNING ics_sequence;`,
      {
        type: QueryTypes.UPDATE,
        replacements: { idRendezVous }
      }
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return rendezVousIcsSequence[0][0]?.['ics_sequence']
  }
}
