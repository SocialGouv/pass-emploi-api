import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerEtablissementAuthorizer } from '../authorizers/authorize-conseiller-etablissement'
import { fromSqlToRendezVousConseillerQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { AnimationCollectiveQueryModel } from './query-models/rendez-vous.query-model'
import { DateTime } from 'luxon'
import { CodeTypeRendezVous, RendezVous } from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'

const NOMBRE_ANIMATIONS_COLLECTIVES_MAX = 200

export interface GetAnimationsCollectivesQuery extends Query {
  idEtablissement: string
  dateDebut?: DateTime
  dateFin?: DateTime
}

@Injectable()
export class GetAnimationsCollectivesQueryHandler extends QueryHandler<
  GetAnimationsCollectivesQuery,
  Result<AnimationCollectiveQueryModel[]>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private conseillerAgenceAuthorizer: ConseillerEtablissementAuthorizer,
    private dateService: DateService
  ) {
    super('GetAnimationsCollectivesQueryHandler')
  }

  async handle(
    query: GetAnimationsCollectivesQuery
  ): Promise<Result<AnimationCollectiveQueryModel[]>> {
    const rdvSql = await RendezVousSqlModel.findAll({
      where: {
        idAgence: query.idEtablissement,
        dateSuppression: {
          [Op.is]: null
        },
        type: {
          [Op.in]: [
            CodeTypeRendezVous.INFORMATION_COLLECTIVE,
            CodeTypeRendezVous.ATELIER
          ]
        },
        ...generateDateCondition(query.dateDebut, query.dateFin)
      },
      include: [{ model: JeuneSqlModel }],
      order: [['date', 'ASC']],
      limit: NOMBRE_ANIMATIONS_COLLECTIVES_MAX
    })

    const maintenant = this.dateService.nowJs()

    return success(
      rdvSql.map(rdv => ({
        ...fromSqlToRendezVousConseillerQueryModel(rdv),
        statut: construireStatut(rdv, maintenant)
      }))
    )
  }

  async authorize(
    query: GetAnimationsCollectivesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.authorize(
      query.idEtablissement,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

function generateDateCondition(
  dateDebut?: DateTime,
  dateFin?: DateTime
): { date?: Record<string, string> } {
  let dateCondition = undefined

  if (dateDebut) {
    dateCondition = {
      [Op.gte]: dateDebut.toJSDate()
    }
  }
  if (dateFin) {
    dateCondition = {
      ...dateCondition,
      [Op.lte]: dateFin.toJSDate()
    }
  }

  return dateCondition ? { date: dateCondition } : {}
}

function construireStatut(
  rendezVousSql: RendezVousSqlModel,
  maintenant: Date
): RendezVous.AnimationCollective.Statut {
  if (rendezVousSql.dateCloture === null) {
    if (rendezVousSql.date <= maintenant) {
      return RendezVous.AnimationCollective.Statut.A_CLOTURER
    }
    return RendezVous.AnimationCollective.Statut.A_VENIR
  } else {
    return RendezVous.AnimationCollective.Statut.CLORUREE
  }
}
