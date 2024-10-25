import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { TYPES_ANIMATIONS_COLLECTIVES } from 'src/domain/rendez-vous/rendez-vous'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../utils/date-service'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { GetAnimationCollectiveV2QueryModel } from '../query-models/rendez-vous.query-model'

const NOMBRE_ANIMATIONS_COLLECTIVES_MAX = 10
const PAGE_PAR_DEFAUT = 1

export interface GetAnimationsCollectivesV2Query extends Query {
  idEtablissement: string
  page?: number
  limit?: number
  aClore?: boolean
}

@Injectable()
export class GetAnimationsCollectivesV2QueryHandler extends QueryHandler<
  GetAnimationsCollectivesV2Query,
  Result<GetAnimationCollectiveV2QueryModel>
> {
  constructor(
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
    private dateService: DateService
  ) {
    super('GetAnimationsCollectivesQueryHandler')
  }

  async handle(
    query: GetAnimationsCollectivesV2Query
  ): Promise<Result<GetAnimationCollectiveV2QueryModel>> {
    let whereClause = {}
    const maintenant = this.dateService.nowJs()

    const limit = query.limit ?? NOMBRE_ANIMATIONS_COLLECTIVES_MAX
    const page = query.page ?? PAGE_PAR_DEFAUT

    switch (query.aClore) {
      case true:
        whereClause = {
          where: {
            idAgence: query.idEtablissement,
            type: {
              [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
            },
            dateCloture: null,
            date: {
              [Op.lt]: maintenant
            }
          }
        }
        break
      case false:
        whereClause = {
          where: {
            idAgence: query.idEtablissement,
            type: {
              [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
            },
            [Op.or]: {
              dateCloture: { [Op.ne]: null },
              date: {
                [Op.gte]: maintenant
              }
            }
          }
        }
        break
      default:
        whereClause = {
          where: {
            idAgence: query.idEtablissement,
            type: {
              [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
            }
          }
        }
    }

    const animationsCollectives = await RendezVousSqlModel.findAndCountAll({
      attributes: ['id', 'titre', 'date'],
      ...whereClause,
      include: [{ model: JeuneSqlModel }],
      order: [['date', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    })

    return success({
      pagination: {
        page: page,
        limit,
        total: animationsCollectives.count
      },
      resultats: animationsCollectives.rows.map(rdv => ({
        id: rdv.id,
        titre: rdv.titre,
        date: rdv.date.toISOString(),
        nombreInscrits: rdv.jeunes.length
      }))
    })
  }

  async authorize(
    query: GetAnimationsCollectivesV2Query,
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
