import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface GetIdentiteJeunesQuery extends Query {
  idConseiller: string
  idsJeunes: string[]
}

type IdentitesJeunesQueryModel = Array<{
  id: string
  nom: string
  prenom: string
}>

export class GetIdentiteJeunesQueryHandler extends QueryHandler<
  GetIdentiteJeunesQuery,
  Result<IdentitesJeunesQueryModel>
> {
  constructor(private readonly conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetIdentiteJeunesQueryHandler')
  }

  async handle(
    query: GetIdentiteJeunesQuery
  ): Promise<Result<IdentitesJeunesQueryModel>> {
    const { idsJeunes, idConseiller } = query
    const sql: JeuneSqlModel[] = await JeuneSqlModel.findAll({
      where: { id: idsJeunes, idConseiller }
    })

    return success(
      sql.map(jeuneSql => ({
        id: jeuneSql.id,
        nom: jeuneSql.nom,
        prenom: jeuneSql.prenom
      }))
    )
  }

  async authorize(
    query: GetIdentiteJeunesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
