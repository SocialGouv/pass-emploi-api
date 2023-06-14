import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estMilo } from '../../domain/core'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from '../../infrastructure/sequelize/models/situations-milo.sql-model'
import { TransfertConseillerSqlModel } from '../../infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { ConseillerInterStructureMiloAuthorizer } from '../authorizers/conseiller-inter-structure-milo-authorizer'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { fromSqlToDetailJeuneQueryModel } from './query-mappers/jeune.mappers'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-model'

export interface GetDetailJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetDetailJeuneQueryHandler extends QueryHandler<
  GetDetailJeuneQuery,
  Result<DetailJeuneQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private conseillerAgenceAuthorizer: ConseillerInterStructureMiloAuthorizer,
    private configService: ConfigService
  ) {
    super('GetDetailJeuneQueryHandler')
  }

  async handle(
    query: GetDetailJeuneQuery
  ): Promise<Result<DetailJeuneQueryModel>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [
        ConseillerSqlModel,
        SituationsMiloSqlModel,
        {
          model: TransfertConseillerSqlModel,
          order: [['dateTransfert', 'DESC']],
          limit: 1
        }
      ]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    let urlDossier
    if (estMilo(jeuneSqlModel.structure)) {
      urlDossier = this.configService.get('milo.urlWeb')
    }
    return success(fromSqlToDetailJeuneQueryModel(jeuneSqlModel, urlDossier))
  }

  async authorize(
    query: GetDetailJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo(
        query.idJeune,
        utilisateur
      )
    }
    return this.jeuneAuthorizer.autoriserLeJeune(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
