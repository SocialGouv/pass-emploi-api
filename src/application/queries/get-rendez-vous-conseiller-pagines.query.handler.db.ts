import { Inject, Injectable } from '@nestjs/common'
import { Op, Order, Sequelize } from 'sequelize'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { RendezVous } from 'src/domain/rendez-vous'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { fromSqlToRendezVousConseillerQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { RendezVousConseillerQueryModel } from './query-models/rendez-vous.query-model'

export interface GetRendezVousConseillerPaginesQuery extends Query {
  idConseiller: string
  tri?: RendezVous.Tri
  dateDebut?: Date
  dateFin?: Date
  presenceConseiller?: boolean
}

@Injectable()
export class GetRendezVousConseillerPaginesQueryHandler extends QueryHandler<
  GetRendezVousConseillerPaginesQuery,
  Result<RendezVousConseillerQueryModel[]>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetRendezVousConseillerPaginesQueryHandler')
  }

  async handle(
    query: GetRendezVousConseillerPaginesQuery
  ): Promise<Result<RendezVousConseillerQueryModel[]>> {
    const presenceConseillerCondition: { presenceConseiller?: boolean } = {}
    if (query.presenceConseiller !== undefined) {
      presenceConseillerCondition.presenceConseiller = query.presenceConseiller
    }

    let dateCondition
    if (query.dateDebut === undefined && query.dateFin === undefined) {
      dateCondition = {}
    } else {
      let dateDebutCondition
      if (query.dateDebut !== undefined) {
        dateDebutCondition = {
          [Op.gte]: query.dateDebut
        }
      }

      let dateFinCondition
      if (query.dateFin !== undefined) {
        dateFinCondition = {
          [Op.lte]: query.dateFin
        }
      }

      dateCondition = { date: { ...dateDebutCondition, ...dateFinCondition } }
    }

    const rendezVousSql = await RendezVousSqlModel.findAll({
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
        dateSuppression: {
          [Op.is]: null
        },
        ...dateCondition,
        ...presenceConseillerCondition
      },
      order: mapTriToOrder[query.tri ?? RendezVous.Tri.DATE_CROISSANTE]
    })

    return success(rendezVousSql.map(fromSqlToRendezVousConseillerQueryModel))
  }

  async authorize(
    query: GetRendezVousConseillerPaginesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}

const mapTriToOrder: Record<RendezVous.Tri, Order> = {
  date_croissante: [['date', 'ASC']],
  date_decroissante: [['date', 'DESC']]
}
