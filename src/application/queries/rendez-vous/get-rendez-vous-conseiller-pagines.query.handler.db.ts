import { Inject, Injectable } from '@nestjs/common'
import { Op, Order, Sequelize } from 'sequelize'
import { Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { fromSqlToRendezVousConseillerQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { RendezVousConseillerQueryModel } from '../query-models/rendez-vous.query-model'
import { ConfigService } from '@nestjs/config'
import { generateSourceRendezVousCondition } from '../../../config/feature-flipping'

const NOMBRE_RDV_MAX = 200

export enum TriRendezVous {
  DATE_CROISSANTE = 'date_croissante',
  DATE_DECROISSANTE = 'date_decroissante'
}

export interface GetRendezVousConseillerPaginesQuery extends Query {
  idConseiller: string
  tri?: TriRendezVous
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
    private conseillerAuthorizer: ConseillerAuthorizer,
    private configuration: ConfigService
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
        ...generateSourceRendezVousCondition(this.configuration),
        ...generateDateCondition(query.dateDebut, query.dateFin),
        ...presenceConseillerCondition
      },
      order: mapTriToOrder[query.tri ?? TriRendezVous.DATE_CROISSANTE],
      limit: NOMBRE_RDV_MAX
    })

    return success(
      rendezVousSql.map(rdv => fromSqlToRendezVousConseillerQueryModel(rdv))
    )
  }

  async authorize(
    query: GetRendezVousConseillerPaginesQuery,
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

const mapTriToOrder: Record<TriRendezVous, Order> = {
  date_croissante: [['date', 'ASC']],
  date_decroissante: [['date', 'DESC']]
}

function generateDateCondition(
  dateDebut?: Date,
  dateFin?: Date
): { date?: Record<string, string> } {
  let dateCondition = undefined

  if (dateDebut !== undefined) {
    dateCondition = {
      [Op.gte]: dateDebut
    }
  }
  if (dateFin !== undefined) {
    dateCondition = {
      ...dateCondition,
      [Op.lte]: dateFin
    }
  }

  return dateCondition ? { date: dateCondition } : {}
}
