import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../../domain/authentification'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { RendezVousConseillerFutursEtPassesQueryModel } from '../query-models/rendez-vous.query-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { Op, Sequelize } from 'sequelize'
import { DateService } from '../../../utils/date-service'
import { fromSqlToRendezVousConseillerQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { Result } from '../../../building-blocks/types/result'
import { generateSourceRendezVousCondition } from '../../../config/feature-flipping'
import { ConfigService } from '@nestjs/config'

export interface GetAllRendezVousConseillerQuery extends Query {
  idConseiller: string
  presenceConseiller?: boolean
}

@Injectable()
export class GetAllRendezVousConseillerQueryHandler extends QueryHandler<
  GetAllRendezVousConseillerQuery,
  RendezVousConseillerFutursEtPassesQueryModel
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private dateService: DateService,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private configuration: ConfigService
  ) {
    super('GetAllRendezVousConseillerQueryHandler')
  }

  async handle(
    query: GetAllRendezVousConseillerQuery
  ): Promise<RendezVousConseillerFutursEtPassesQueryModel> {
    const maintenant = this.dateService.nowJs()

    const presenceConseillerCondition: { presenceConseiller?: boolean } = {}
    if (query.presenceConseiller !== undefined) {
      presenceConseillerCondition.presenceConseiller = query.presenceConseiller
    }

    const rendezVousPassesPromise = RendezVousSqlModel.findAll({
      include: [{ model: JeuneSqlModel }],
      replacements: { id_conseiller: query.idConseiller },
      where: {
        ...generateSourceRendezVousCondition(this.configuration),
        id: {
          [Op.in]: this.sequelize.literal(`(
                SELECT DISTINCT id_rendez_vous
              FROM rendez_vous_jeune_association, jeune
              WHERE rendez_vous_jeune_association.id_jeune = jeune.id
              AND jeune.id_conseiller = :id_conseiller
            )`)
        },
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
      include: [{ model: JeuneSqlModel }],
      replacements: { id_conseiller: query.idConseiller },
      where: {
        id: {
          [Op.in]: this.sequelize.literal(`(
                SELECT DISTINCT id_rendez_vous
              FROM rendez_vous_jeune_association, jeune
              WHERE rendez_vous_jeune_association.id_jeune = jeune.id
              AND jeune.id_conseiller = :id_conseiller
            )`)
        },
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
      passes: rendezVousPasses.map(rdv =>
        fromSqlToRendezVousConseillerQueryModel(rdv)
      ),
      futurs: rendezVousFuturs.map(rdv =>
        fromSqlToRendezVousConseillerQueryModel(rdv)
      )
    }
  }

  async authorize(
    query: GetAllRendezVousConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
