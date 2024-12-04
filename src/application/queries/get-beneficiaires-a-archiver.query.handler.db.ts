import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { IdentiteJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'
import { DateService } from 'src/utils/date-service'

type GetBeneficiairesAArchiverQuery = {
  idConseiller: string
}

@Injectable()
export class GetBeneficiairesAArchiverQueryHandler extends QueryHandler<
  GetBeneficiairesAArchiverQuery,
  Result<IdentiteJeuneQueryModel[]>
> {
  constructor(
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    private readonly dateService: DateService,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetBeneficiairesAArchiverQueryHandler')
  }

  async authorize(
    query: GetBeneficiairesAArchiverQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async handle(
    query: GetBeneficiairesAArchiverQuery
  ): Promise<Result<IdentiteJeuneQueryModel[]>> {
    const ilYa6mois = this.dateService
      .now()
      .minus({ month: 6 })
      .startOf('day')
      .toJSDate()

    const models = await JeuneSqlModel.findAll({
      attributes: ['id', 'nom', 'prenom'],
      where: [
        { id_conseiller: query.idConseiller },
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
    })

    return success(models.map(({ id, nom, prenom }) => ({ id, nom, prenom })))
  }

  async monitor(): Promise<void> {
    return
  }
}
