import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { AnimationCollectiveJeuneQueryModel } from './query-models/rendez-vous.query-model'
import { Query } from '../../building-blocks/types/query'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { DateTime } from 'luxon'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { Op, Sequelize } from 'sequelize'
import { CodeTypeRendezVous } from '../../domain/rendez-vous/rendez-vous'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToAnimationCollectiveJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'

export interface GetAnimationsCollectivesJeuneQuery extends Query {
  idJeune: string
  maintenant: DateTime
}

export class GetAnimationsCollectivesJeuneQueryHandler extends QueryHandler<
  GetAnimationsCollectivesJeuneQuery,
  Result<AnimationCollectiveJeuneQueryModel[]>
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetAnimationsCollectivesJeuneQueryHandlerQueryHandler')
  }

  async authorize(
    query: GetAnimationsCollectivesJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async handle(
    query: GetAnimationsCollectivesJeuneQuery
  ): Promise<Result<AnimationCollectiveJeuneQueryModel[]>> {
    const rendezVousSql = await RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          required: false
        }
      ],
      where: {
        idAgence: {
          [Op.in]: Sequelize.literal(
            '(select id_agence from conseiller left join jeune on conseiller.id = jeune.id_conseiller where jeune.id = :id_jeune)'
          )
        },
        type: {
          [Op.in]: [
            CodeTypeRendezVous.INFORMATION_COLLECTIVE,
            CodeTypeRendezVous.ATELIER
          ]
        },
        dateSuppression: {
          [Op.is]: null
        }
      },
      order: [['date', 'ASC']],
      replacements: {
        id_jeune: query.idJeune
      }
    })

    return success(
      rendezVousSql.map(rdvSql => {
        return fromSqlToAnimationCollectiveJeuneQueryModel(
          rdvSql,
          query.idJeune
        )
      })
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
