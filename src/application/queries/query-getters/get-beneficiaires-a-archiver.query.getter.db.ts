import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { IdentiteJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { Result, success } from 'src/building-blocks/types/result'
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
    const models =
      await this.queryBeneficiairesAArchiver<IdentiteJeuneQueryModel>(
        'id, nom, prenom',
        idConseiller
      )
    return success(models)
  }

  async count(idConseiller: string): Promise<number> {
    const rows = await this.queryBeneficiairesAArchiver<{ count: string }>(
      'COUNT(id)',
      idConseiller
    )

    return Number.parseInt(rows[0].count)
  }

  private async queryBeneficiairesAArchiver<T extends object>(
    query: string,
    idConseiller: string
  ): Promise<T[]> {
    const ilYa6mois = this.dateService.now().minus({ month: 6 }).startOf('day')

    return this.sequelize.query<T>(
      `
        SELECT ${query} FROM jeune
        WHERE id_conseiller = :idConseiller
        AND (
          date_fin_cej < :date
          OR date_derniere_actualisation_token < :date
          OR (EXISTS (SELECT 1 FROM jeune_milo_a_archiver WHERE jeune_milo_a_archiver.id_jeune = jeune.id)) IS true
        )
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { idConseiller, date: ilYa6mois.toJSDate() }
      }
    )
  }
}
