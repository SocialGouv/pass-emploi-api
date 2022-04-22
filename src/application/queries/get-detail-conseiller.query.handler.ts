import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { fromSqlToDetailConseillerQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'

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
      query.idConseiller
    )
    if (!conseillerSqlModel) {
      return undefined
    }

    return fromSqlToDetailConseillerQueryModel(conseillerSqlModel)
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
