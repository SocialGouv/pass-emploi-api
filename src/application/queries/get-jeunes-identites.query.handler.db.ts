import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { IdentiteJeuneQueryModel } from './query-models/jeunes.query-model'

export interface GetJeunesIdentitesQuery extends Query {
  idConseiller: string
  idsJeunes: string[]
}

@Injectable()
export class GetJeunesIdentitesQueryHandler extends QueryHandler<
  GetJeunesIdentitesQuery,
  Result<IdentiteJeuneQueryModel[]>
> {
  constructor(private readonly conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetJeunesIdentitesQueryHandler')
  }

  async handle(
    query: GetJeunesIdentitesQuery
  ): Promise<Result<IdentiteJeuneQueryModel[]>> {
    const { idsJeunes, idConseiller } = query
    const sql: JeuneSqlModel[] = await JeuneSqlModel.findAll({
      attributes: ['id', 'nom', 'prenom'],
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
    query: GetJeunesIdentitesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
