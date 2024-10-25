import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { fromSqlToAnimationCollectiveQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { AnimationCollectiveQueryModel } from '../query-models/rendez-vous.query-model'
import { DateService } from '../../../utils/date-service'
import { TYPES_ANIMATIONS_COLLECTIVES } from '../../../domain/rendez-vous/rendez-vous'

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
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
    private dateService: DateService
  ) {
    super('GetAnimationsCollectivesQueryHandler')
  }

  async handle(
    query: GetAnimationsCollectivesQuery
  ): Promise<Result<AnimationCollectiveQueryModel[]>> {
    const animationsCollectivesSql = await RendezVousSqlModel.findAll({
      where: {
        idAgence: query.idEtablissement,
        type: {
          [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
        },
        ...generateDateCondition(query.dateDebut, query.dateFin)
      },
      include: [{ model: JeuneSqlModel }],
      order: [['date', 'ASC']],
      limit: NOMBRE_ANIMATIONS_COLLECTIVES_MAX
    })

    const maintenant = this.dateService.nowJs()
    return success(
      animationsCollectivesSql.map(rdv =>
        fromSqlToAnimationCollectiveQueryModel(rdv, maintenant)
      )
    )
  }

  async authorize(
    query: GetAnimationsCollectivesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.autoriserConseillerPourUneAgence(
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
