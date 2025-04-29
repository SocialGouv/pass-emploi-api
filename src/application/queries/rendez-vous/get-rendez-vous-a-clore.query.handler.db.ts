import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { TYPES_ANIMATIONS_COLLECTIVES } from 'src/domain/rendez-vous/rendez-vous'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { DateService } from '../../../utils/date-service'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { GetRendezVousACloreQueryModel } from '../query-models/rendez-vous.query-model'

const NOMBRE_RDV_MAX = 10
const PAGE_PAR_DEFAUT = 1

export interface GetRendezVousACloreQuery extends Query {
  idConseiller: string
  page?: number
  limit?: number
}

@Injectable()
export class GetRendezVousACloreQueryHandler extends QueryHandler<
  GetRendezVousACloreQuery,
  Result<GetRendezVousACloreQueryModel>
> {
  constructor(
    private conseillerAgenceAuthorizer: ConseillerAuthorizer,
    private dateService: DateService,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetRendezVousACloreQueryHandler')
  }

  async handle(
    query: GetRendezVousACloreQuery
  ): Promise<Result<GetRendezVousACloreQueryModel>> {
    const conseillerSql = await ConseillerSqlModel.findByPk(query.idConseiller)
    if (!conseillerSql) {
      return failure(new NonTrouveError('Conseiller', query.idConseiller))
    }

    const maintenant = this.dateService.nowJs()

    const limit = query.limit ?? NOMBRE_RDV_MAX
    const page = query.page ?? PAGE_PAR_DEFAUT

    const whereAgence = conseillerSql.idStructureMilo
      ? {
          idAgence: conseillerSql.idStructureMilo,
          type: {
            [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
          },
          dateCloture: null,
          date: {
            [Op.lt]: maintenant
          }
        }
      : undefined
    const whereConseiller = {
      id: {
        [Op.in]: this.sequelize.literal(`(
              SELECT DISTINCT id_rendez_vous
            FROM rendez_vous_jeune_association, jeune
            WHERE rendez_vous_jeune_association.id_jeune = jeune.id
            AND jeune.id_conseiller = :id_conseiller
          )`)
      },
      dateCloture: null,
      type: {
        [Op.notIn]: TYPES_ANIMATIONS_COLLECTIVES
      },
      date: {
        [Op.lt]: maintenant
      }
    }

    const whereClause = {
      where: whereAgence
        ? { [Op.or]: [whereConseiller, whereAgence] }
        : whereConseiller
    }

    const rdvs = await RendezVousSqlModel.findAndCountAll({
      attributes: ['id', 'titre', 'date', 'type'],
      ...whereClause,
      include: [{ model: JeuneSqlModel }],
      order: [['date', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
      replacements: { id_conseiller: query.idConseiller }
    })

    return success({
      pagination: {
        page: page,
        limit,
        total: rdvs.count
      },
      resultats: rdvs.rows.map(rdv => ({
        id: rdv.id,
        titre: rdv.titre,
        date: rdv.date.toISOString(),
        nombreInscrits: rdv.jeunes.length,
        type: rdv.type
      }))
    })
  }

  async authorize(
    query: GetRendezVousACloreQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
