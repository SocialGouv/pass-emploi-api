import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { fromSqlToDetailConseillerQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetDetailConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetDetailConseillerQueryHandler extends QueryHandler<
  GetDetailConseillerQuery,
  DetailConseillerQueryModel | undefined
> {
  constructor(private conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetDetailConseillerQueryHandler')
  }

  async handle(
    query: GetDetailConseillerQuery
  ): Promise<DetailConseillerQueryModel | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(
      query.idConseiller,
      {
        include: [AgenceSqlModel]
      }
    )

    if (!conseillerSqlModel) {
      return undefined
    }

    const jeuneARecuperer = await JeuneSqlModel.findOne({
      where: { idConseillerInitial: conseillerSqlModel.id },
      attributes: ['id']
    })

    return fromSqlToDetailConseillerQueryModel(
      conseillerSqlModel,
      Boolean(Boolean(jeuneARecuperer))
    )
  }
  async authorize(
    query: GetDetailConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
