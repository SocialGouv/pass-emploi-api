import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { ListeDeDiffusionSqlModel } from '../../infrastructure/sequelize/models/liste-de-diffusion.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetListesDeDiffusionDuConseillerQuery extends Query {
  idConseiller: string
}

export class GetListesDeDiffusionDuConseillerQueryHandler extends QueryHandler<
  GetListesDeDiffusionDuConseillerQuery,
  Result<ListeDeDiffusionQueryModel[]>
> {
  constructor() {
    super('GetListesDeDiffusionDuConseillerQueryHandler')
  }

  async authorize(
    _query: GetListesDeDiffusionDuConseillerQuery,
    _utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return emptySuccess()
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

export class ListeDeDiffusionQueryModel {
  id: string
  titre: string
  dateDeCreation: Date
  beneficiaires: Array<{
    id: string
    nom: string
    prenom: string
    estDansLePortefeuille?: boolean
  }>
}

function fromSqlToListeDeDiffusionQueryModel(
  listeDeDiffusionSql: ListeDeDiffusionSqlModel
): ListeDeDiffusionQueryModel {
  return {
    id: listeDeDiffusionSql.id,
    titre: listeDeDiffusionSql.titre,
    dateDeCreation: listeDeDiffusionSql.dateDeCreation,
    beneficiaires: listeDeDiffusionSql.jeunes.map(beneficiaire => ({
      id: beneficiaire.id,
      nom: beneficiaire.nom,
      prenom: beneficiaire.prenom,
      estDansLePortefeuille:
        beneficiaire.idConseiller === listeDeDiffusionSql.idConseiller
    }))
  }
}
