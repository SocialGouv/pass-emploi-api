import { Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousAuthorizer } from '../../authorizers/rendezvous-authorizer'
import { fromSqlToRendezVousDetailJeuneQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { RendezVousJeuneDetailQueryModel } from '../query-models/rendez-vous.query-model'

export interface GetDetailRendezVousJeuneQuery extends Query {
  idRendezVous: string
  idJeune: string
}

@Injectable()
export class GetDetailRendezVousJeuneQueryHandler extends QueryHandler<
  GetDetailRendezVousJeuneQuery,
  Result<RendezVousJeuneDetailQueryModel>
> {
  constructor(private rendezVousAuthorizer: RendezVousAuthorizer) {
    super('GetDetailRendezVousJeuneQueryHandlerQueryHandler')
  }

  async authorize(
    query: GetDetailRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.JEUNE) {
      return this.rendezVousAuthorizer.autoriserJeunePourSonRendezVous(
        query.idRendezVous,
        utilisateur
      )
    }
    return this.rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
      query.idRendezVous,
      utilisateur
    )
  }

  async handle(
    query: GetDetailRendezVousJeuneQuery,
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
