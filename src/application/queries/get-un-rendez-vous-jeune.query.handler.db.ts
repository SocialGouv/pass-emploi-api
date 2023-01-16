import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { RendezVousJeuneDetailQueryModel } from './query-models/rendez-vous.query-model'
import { Query } from '../../building-blocks/types/query'
import { Authentification } from '../../domain/authentification'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { fromSqlToRendezVousDetailJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { Injectable } from '@nestjs/common'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'

export interface GetUnRendezVousJeuneQuery extends Query {
  idRendezVous: string
  idJeune: string
}

@Injectable()
export class GetUnRendezVousJeuneQueryHandler extends QueryHandler<
  GetUnRendezVousJeuneQuery,
  Result<RendezVousJeuneDetailQueryModel>
> {
  constructor(private rendezVousAuthorizer: RendezVousAuthorizer) {
    super('GetUnRendezVousJeuneQueryHandlerQueryHandler')
  }

  async authorize(
    query: GetUnRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id !== query.idJeune
    ) {
      return failure(new DroitsInsuffisants())
    }
    return await this.rendezVousAuthorizer.authorize(
      query.idRendezVous,
      utilisateur
    )
  }

  async handle(
    query: GetUnRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<RendezVousJeuneDetailQueryModel>> {
    const rendezVousSql = await RendezVousSqlModel.findByPk(
      query.idRendezVous,
      {
        include: [
          {
            model: JeuneSqlModel,
            required: false
          }
        ]
      }
    )

    if (!rendezVousSql) {
      return failure(new NonTrouveError('RendezVous', query.idRendezVous))
    }

    return success(
      fromSqlToRendezVousDetailJeuneQueryModel(
        rendezVousSql,
        query.idJeune,
        utilisateur.type
      )
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
