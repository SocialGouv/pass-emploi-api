import { Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'
import { fromSqlToRendezVousConseillerQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { RendezVousConseillerQueryModel } from './query-models/rendez-vous.query-model'

export interface GetDetailRendezVousQuery extends Query {
  idRendezVous: string
}

@Injectable()
export class GetDetailRendezVousQueryHandler extends QueryHandler<
  GetDetailRendezVousQuery,
  Result<RendezVousConseillerQueryModel>
> {
  constructor(private rendezVousAuthorizer: RendezVousAuthorizer) {
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
  ): Promise<Result> {
    return this.rendezVousAuthorizer.authorize(query.idRendezVous, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
