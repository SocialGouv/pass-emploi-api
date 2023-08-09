import { Injectable } from '@nestjs/common'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import {
  GetSessionsJeuneMiloQueryGetter,
  sessionsAvecInscriptionTriees
} from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import {
  failure,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetSessionsJeuneMiloQuery extends Query {
  idJeune: string
  token: string
  filtrerEstInscrit?: boolean
}

@Injectable()
export class GetSessionsJeuneMiloQueryHandler extends QueryHandler<
  GetSessionsJeuneMiloQuery,
  Result<SessionJeuneMiloQueryModel[]>
> {
  constructor(
    private readonly getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetSessionsJeuneMiloQueryHandler')
  }

  async handle(
    query: GetSessionsJeuneMiloQuery
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: ConseillerSqlModel, required: true }]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    if (!jeuneSqlModel.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(query.idJeune))
    }

    const resultSessions = await this.getSessionsQueryGetter.handle(
      jeuneSqlModel.idPartenaire,
      query.token
    )

    if (query.filtrerEstInscrit && isSuccess(resultSessions)) {
      return success(sessionsAvecInscriptionTriees(resultSessions))
    }

    return resultSessions
  }

  async authorize(
    query: GetSessionsJeuneMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
