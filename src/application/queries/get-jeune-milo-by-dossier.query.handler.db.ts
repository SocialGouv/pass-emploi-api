import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { JeuneQueryModel } from './query-models/jeunes.query-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetJeuneMiloByDossierQuery extends Query {
  idDossier: string
}

@Injectable()
export class GetJeuneMiloByDossierQueryHandler extends QueryHandler<
  GetJeuneMiloByDossierQuery,
  Result<JeuneQueryModel>
> {
  constructor(private readonly conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetJeuneMiloByDossierQueryHandler')
  }

  async handle(
    query: GetJeuneMiloByDossierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<JeuneQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        idPartenaire: query.idDossier,
        idConseiller: utilisateur.id
      }
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idDossier))
    }

    return success(fromSqlToJeuneQueryModel(jeuneSqlModel))
  }

  async authorize(
    _query: GetJeuneMiloByDossierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserToutConseiller(utilisateur, [
      Core.Structure.MILO
    ])
  }

  async monitor(): Promise<void> {
    return
  }
}

function fromSqlToJeuneQueryModel(
  jeuneSqlModel: JeuneSqlModel
): JeuneQueryModel {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    idConseiller: jeuneSqlModel.idConseiller!
  }
}
