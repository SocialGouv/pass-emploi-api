import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estMilo } from '../../domain/core'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneMiloAArchiverSqlModel } from '../../infrastructure/sequelize/models/jeune-milo-a-archiver.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from '../../infrastructure/sequelize/models/situations-milo.sql-model'
import { TransfertConseillerSqlModel } from '../../infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { fromSqlToDetailJeuneQueryModel } from './query-mappers/jeune.mappers'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-model'
import { exec } from 'child_process'

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
    private conseillerAgenceAuthorizer: ConseillerInterAgenceAuthorizer,
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

    if (estMilo(jeuneSqlModel.structure)) {
      const baseUrlDossier = this.configService.get('milo.urlWeb')
      // TODO estAArchiver -> prendre en compte date dernière activité et date fin cej OU renommer
      const estAArchiver = await JeuneMiloAArchiverSqlModel.findByPk(
        jeuneSqlModel.id
      )
      return success(
        fromSqlToDetailJeuneQueryModel(jeuneSqlModel, {
          baseUrlDossier,
          estAArchiver: Boolean(estAArchiver)
        })
      )
    }

    return success(fromSqlToDetailJeuneQueryModel(jeuneSqlModel))
  }

  async authorize(
    query: GetDetailJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estConseiller(utilisateur.type)) {
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

function _runShellCommand(userInput: string): void {
  exec(`ls ${userInput}`, (err, _stdout, _stderr) => {
    if (err) {
      return
    }
  })
}
