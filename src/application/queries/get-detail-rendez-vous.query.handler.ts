import { Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVousConseillerQueryModel } from './query-models/rendez-vous.query-models'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToRendezVousConseillerQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { Unauthorized } from '../../domain/erreur'

export interface GetDetailRendezVousQuery extends Query {
  idRendezVous: string
}

@Injectable()
export class GetDetailRendezVousQueryHandler extends QueryHandler<
  GetDetailRendezVousQuery,
  Result<RendezVousConseillerQueryModel>
> {
  constructor() {
    super('GetDetailRendezVousQueryHandler')
  }

  async handle(
    query: GetDetailRendezVousQuery
  ): Promise<Result<RendezVousConseillerQueryModel>> {
    const rendezVousSqlModel = await RendezVousSqlModel.findByPk(
      query.idRendezVous,
      {
        include: [
          {
            model: JeuneSqlModel,
            required: true
          }
        ]
      }
    )

    if (!rendezVousSqlModel) {
      return failure(new NonTrouveError('RendezVous', query.idRendezVous))
    }

    return success(fromSqlToRendezVousConseillerQueryModel(rendezVousSqlModel))
  }

  async authorize(
    query: GetDetailRendezVousQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const rendezVousSql = await RendezVousSqlModel.findByPk(
      query.idRendezVous,
      {
        include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
      }
    )

    if (
      rendezVousSql &&
      utilisateur &&
      utilisateur.type === Authentification.Type.CONSEILLER &&
      rendezVousSql.jeunes.find(
        jeune => utilisateur.id === jeune.conseiller?.id
      )
    ) {
      return
    }

    throw new Unauthorized('RendezVous')
  }

  async monitor(): Promise<void> {
    return
  }
}
