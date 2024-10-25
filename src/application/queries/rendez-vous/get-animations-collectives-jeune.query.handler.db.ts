import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { RendezVousJeuneDetailQueryModel } from '../query-models/rendez-vous.query-model'
import { Query } from '../../../building-blocks/types/query'
import { Authentification } from '../../../domain/authentification'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { DateTime } from 'luxon'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { Op, Sequelize } from 'sequelize'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToRendezVousDetailJeuneQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { Injectable } from '@nestjs/common'
import { TYPES_ANIMATIONS_COLLECTIVES } from '../../../domain/rendez-vous/rendez-vous'

export interface GetAnimationsCollectivesJeuneQuery extends Query {
  idJeune: string
  maintenant: DateTime
}

@Injectable()
export class GetAnimationsCollectivesJeuneQueryHandler extends QueryHandler<
  GetAnimationsCollectivesJeuneQuery,
  Result<RendezVousJeuneDetailQueryModel[]>
> {
  constructor(private jeuneAuthorizer: JeuneAuthorizer) {
    super('GetAnimationsCollectivesJeuneQueryHandler')
  }

  async authorize(
    query: GetAnimationsCollectivesJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async handle(
    query: GetAnimationsCollectivesJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<RendezVousJeuneDetailQueryModel[]>> {
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
          [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
        },
        date: {
          [Op.gte]: query.maintenant.toJSDate()
        }
      },
      order: [['date', 'ASC']],
      replacements: {
        id_jeune: query.idJeune
      }
    })

    return success(
      rendezVousSql.map(rdvSql => {
        return fromSqlToRendezVousDetailJeuneQueryModel(
          rdvSql,
          query.idJeune,
          utilisateur.type
        )
      })
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
