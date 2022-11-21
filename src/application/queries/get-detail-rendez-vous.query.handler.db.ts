import { Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'
import { fromSqlToRendezVousConseillerDetailQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { RendezVousConseillerDetailQueryModel } from './query-models/rendez-vous.query-model'
import { LogModificationRendezVousSqlModel } from '../../infrastructure/sequelize/models/log-modification-rendez-vous-sql.model'
import { DateService } from '../../utils/date-service'

export interface GetDetailRendezVousQuery extends Query {
  idRendezVous: string
  avecHistorique?: boolean
}

@Injectable()
export class GetDetailRendezVousQueryHandler extends QueryHandler<
  GetDetailRendezVousQuery,
  Result<RendezVousConseillerDetailQueryModel>
> {
  constructor(
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private dateService: DateService
  ) {
    super('GetDetailRendezVousQueryHandler')
  }

  async handle(
    query: GetDetailRendezVousQuery
  ): Promise<Result<RendezVousConseillerDetailQueryModel>> {
    const rendezVousSqlModel = await RendezVousSqlModel.findByPk(
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

    if (!rendezVousSqlModel) {
      return failure(new NonTrouveError('RendezVous', query.idRendezVous))
    }

    let historiqueSql
    if (query.avecHistorique) {
      historiqueSql = await LogModificationRendezVousSqlModel.findAll({
        where: {
          idRendezVous: query.idRendezVous
        },
        order: [['date', 'DESC']]
      })
    }
    const maintenant = this.dateService.nowJs()
    return success(
      fromSqlToRendezVousConseillerDetailQueryModel(
        rendezVousSqlModel,
        maintenant,
        historiqueSql
      )
    )
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
