import { Injectable } from '@nestjs/common'
import { estMilo } from 'src/domain/core'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { LogModificationRendezVousSqlModel } from '../../../infrastructure/sequelize/models/log-modification-rendez-vous-sql.model'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../utils/date-service'
import { ConseillerInterAgenceAuthorizer } from '../../authorizers/conseiller-inter-agence-authorizer'
import { RendezVousAuthorizer } from '../../authorizers/rendezvous-authorizer'
import { fromSqlToRendezVousConseillerDetailQueryModel } from '../query-mappers/rendez-vous-milo.mappers'
import { RendezVousConseillerDetailQueryModel } from '../query-models/rendez-vous.query-model'

export interface GetDetailRendezVousQuery extends Query {
  idRendezVous: string
}

@Injectable()
export class GetDetailRendezVousQueryHandler extends QueryHandler<
  GetDetailRendezVousQuery,
  Result<RendezVousConseillerDetailQueryModel>
> {
  constructor(
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
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
          },
          {
            model: LogModificationRendezVousSqlModel,
            required: false
          }
        ],
        order: [
          [
            { model: LogModificationRendezVousSqlModel, as: 'logs' },
            'date',
            'desc'
          ]
        ]
      }
    )

    if (!rendezVousSqlModel) {
      return failure(new NonTrouveError('RendezVous', query.idRendezVous))
    }

    const maintenant = this.dateService.nowJs()
    return success(
      fromSqlToRendezVousConseillerDetailQueryModel(
        rendezVousSqlModel,
        maintenant
      )
    )
  }

  async authorize(
    query: GetDetailRendezVousQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (estMilo(utilisateur.structure)) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerMiloPourUnRdvDeSonAgenceOuAvecUnJeuneDansLeRdv(
        query.idRendezVous,
        utilisateur
      )
    }
    return this.rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
      query.idRendezVous,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
