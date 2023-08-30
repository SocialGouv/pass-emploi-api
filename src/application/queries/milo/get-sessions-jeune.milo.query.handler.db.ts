import { Injectable } from '@nestjs/common'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'

export interface GetSessionsJeuneMiloQuery extends Query {
  idJeune: string
  accessToken: string
  dateDebut?: DateTime
  dateFin?: DateTime
  filtrerEstInscrit?: boolean
}

@Injectable()
export class GetSessionsJeuneMiloQueryHandler extends QueryHandler<
  GetSessionsJeuneMiloQuery,
  Result<SessionJeuneMiloQueryModel[]>
> {
  constructor(
    private readonly getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly configService: ConfigService
  ) {
    super('GetSessionsJeuneMiloQueryHandler')
  }

  async handle(
    query: GetSessionsJeuneMiloQuery
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
    const FT_RECUPERER_SESSIONS_MILO = this.configService.get(
      'features.recupererSessionsMilo'
    )
    if (!FT_RECUPERER_SESSIONS_MILO) {
      return success([])
    }

    const jeuneSqlModel = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: ConseillerSqlModel, required: true }]
    })
    if (!jeuneSqlModel) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    if (!jeuneSqlModel.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(query.idJeune))
    }

    return this.getSessionsQueryGetter.handle(
      jeuneSqlModel.idPartenaire,
      query.accessToken,
      {
        periode: { debut: query.dateDebut, fin: query.dateFin },
        filtrerEstInscrit: query.filtrerEstInscrit
      }
    )
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
