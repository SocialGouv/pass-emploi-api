import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { WhereOptions } from 'sequelize/types/model'
import { IdentiteJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { Result, success } from 'src/building-blocks/types/result'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'
import { DateService } from 'src/utils/date-service'

@Injectable()
export class GetBeneficiairesAArchiverQueryGetter {
  constructor(
    private readonly dateService: DateService,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

  async handle(
    idConseiller: string
  ): Promise<Result<IdentiteJeuneQueryModel[]>> {
    const models = await JeuneSqlModel.findAll({
      attributes: ['id', 'nom', 'prenom'],
      where: this.getWhere(idConseiller)
    })

    return success(models.map(({ id, nom, prenom }) => ({ id, nom, prenom })))
  }

  async count(idConseiller: string): Promise<number> {
    return JeuneSqlModel.count({ where: this.getWhere(idConseiller) })
  }

  private getWhere(idConseiller: string): WhereOptions {
    const ilYa6mois = this.dateService
      .now()
      .minus({ month: 6 })
      .startOf('day')
      .toJSDate()

    return [
      { id_conseiller: idConseiller },
      {
        [Op.or]: [
          { date_fin_cej: { [Op.lt]: ilYa6mois } },
          { date_derniere_actualisation_token: { [Op.lt]: ilYa6mois } },
          this.sequelize.literal(
            '(exists (select 1 from jeune_milo_a_archiver where jeune_milo_a_archiver.id_jeune = "JeuneSqlModel".id)) is true'
          )
        ]
      }
    ]
  }
}
