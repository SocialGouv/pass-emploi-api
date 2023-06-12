import { Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, failure, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller } from '../../domain/conseiller/conseiller'
import { Core, estMilo } from '../../domain/core'
import { fromSqlToDetailConseillerQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { StructureMiloSqlModel } from '../../infrastructure/sequelize/models/structure-milo.sql-model'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-model'

export interface GetDetailConseillerQuery extends Query {
  idConseiller: string
  structure: Core.Structure
  token: string
}

@Injectable()
export class GetDetailConseillerQueryHandler extends QueryHandler<
  GetDetailConseillerQuery,
  Result<DetailConseillerQueryModel>
> {
  constructor(
    private conseillerAuthorizer: ConseillerAuthorizer,
    private conseillerMiloService: Conseiller.Milo.Service
  ) {
    super('GetDetailConseillerQueryHandler')
  }

  async handle(
    query: GetDetailConseillerQuery
  ): Promise<Result<DetailConseillerQueryModel>> {
    if (estMilo(query.structure)) {
      await this.conseillerMiloService.recupererEtMettreAJourStructure(
        query.idConseiller,
        query.token
      )
    }

    const conseillerSqlModel = await ConseillerSqlModel.findByPk(
      query.idConseiller,
      {
        include: [
          estMilo(query.structure) ? StructureMiloSqlModel : AgenceSqlModel
        ]
      }
    )

    if (!conseillerSqlModel) {
      return failure(new NonTrouveError('Conseiller', query.idConseiller))
    }

    const jeuneARecuperer = await JeuneSqlModel.findOne({
      where: { idConseillerInitial: conseillerSqlModel.id },
      attributes: ['id']
    })

    return success(
      fromSqlToDetailConseillerQueryModel(
        conseillerSqlModel,
        Boolean(jeuneARecuperer)
      )
    )
  }
  async authorize(
    query: GetDetailConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
