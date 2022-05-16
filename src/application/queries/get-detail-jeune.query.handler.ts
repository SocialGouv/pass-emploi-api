import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { TransfertConseillerSqlModel } from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { fromSqlToDetailJeuneQueryModel } from './query-mappers/jeune.mappers'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetDetailJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetDetailJeuneQueryHandler extends QueryHandler<
  GetDetailJeuneQuery,
  DetailJeuneQueryModel | undefined
> {
  constructor(
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetDetailJeuneQueryHandler')
  }

  async handle(
    query: GetDetailJeuneQuery
  ): Promise<DetailJeuneQueryModel | undefined> {
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
      return undefined
    }
    return fromSqlToDetailJeuneQueryModel(jeuneSqlModel)
  }

  async authorize(
    query: GetDetailJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
