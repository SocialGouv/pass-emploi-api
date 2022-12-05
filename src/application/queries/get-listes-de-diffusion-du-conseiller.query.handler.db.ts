import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { fromSqlToListeDeDiffusionQueryModel } from '../../infrastructure/repositories/mappers/conseillers.mappers'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ListeDeDiffusionSqlModel } from '../../infrastructure/sequelize/models/liste-de-diffusion.sql-model'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { ListeDeDiffusionQueryModel } from './query-models/liste-de-diffusion.query-model'

export interface GetListesDeDiffusionDuConseillerQuery extends Query {
  idConseiller: string
}

export class GetListesDeDiffusionDuConseillerQueryHandler extends QueryHandler<
  GetListesDeDiffusionDuConseillerQuery,
  Result<ListeDeDiffusionQueryModel[]>
> {
  constructor(private readonly authorizer: ConseillerAuthorizer) {
    super('GetListesDeDiffusionDuConseillerQueryHandler')
  }

  async authorize(
    query: GetListesDeDiffusionDuConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizer.authorize(query.idConseiller, utilisateur)
  }

  async handle({
    idConseiller
  }: GetListesDeDiffusionDuConseillerQuery): Promise<
    Result<ListeDeDiffusionQueryModel[]>
  > {
    const listeDeDiffusionSql = await ListeDeDiffusionSqlModel.findAll({
      where: { idConseiller },
      include: [JeuneSqlModel]
    })
    return success(listeDeDiffusionSql.map(fromSqlToListeDeDiffusionQueryModel))
  }

  async monitor(): Promise<void> {
    return
  }
}
