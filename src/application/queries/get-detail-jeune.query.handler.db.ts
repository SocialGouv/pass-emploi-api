import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from '../../infrastructure/sequelize/models/situations-milo.sql-model'
import { TransfertConseillerSqlModel } from '../../infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
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
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer,
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
          separate: true,
          order: [['dateTransfert', 'DESC']],
          limit: 1
        }
      ]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    let urlDossier
    if (jeuneSqlModel.structure === Core.Structure.MILO) {
      urlDossier = this.configService.get('milo.urlWeb')
    }
    return success(fromSqlToDetailJeuneQueryModel(jeuneSqlModel, urlDossier))
  }

  async authorize(
    query: GetDetailJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
