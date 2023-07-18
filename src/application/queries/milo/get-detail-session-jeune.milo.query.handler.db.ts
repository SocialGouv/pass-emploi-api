import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { DetailSessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune/jeune'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { estMilo } from 'src/domain/core'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { mapDetailSessionJeuneDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'

export interface GetDetailSessionJeuneMiloQuery extends Query {
  idSession: string
  idJeune: string
  token: string
}

@Injectable()
export class GetDetailSessionJeuneMiloQueryHandler extends QueryHandler<
  GetDetailSessionJeuneMiloQuery,
  Result<DetailSessionJeuneMiloQueryModel>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetDetailSessionJeuneMiloQueryHandler')
  }

  async handle(
    query: GetDetailSessionJeuneMiloQuery
  ): Promise<Result<DetailSessionJeuneMiloQueryModel>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    if (!jeune.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(query.idJeune))
    }

    const idpToken = await this.keycloakClient.exchangeTokenJeune(
      query.token,
      jeune.structure
    )

    const sessionMiloDb = await SessionMiloSqlModel.findOne({
      where: { id: query.idSession, estVisible: true },
      include: [{ model: StructureMiloSqlModel, as: 'structure' }]
    })

    if (!sessionMiloDb) {
      return failure(new NonTrouveError('Session', query.idSession))
    }

    const resultDetailSessionMiloClient =
      await this.miloClient.getDetailSessionJeune(
        idpToken,
        query.idSession,
        jeune.idPartenaire
      )

    if (isFailure(resultDetailSessionMiloClient)) {
      return resultDetailSessionMiloClient
    }

    return success(
      mapDetailSessionJeuneDtoToQueryModel(
        resultDetailSessionMiloClient.data,
        jeune.idPartenaire,
        sessionMiloDb.structure!.timezone
      )
    )
  }

  async authorize(
    query: GetDetailSessionJeuneMiloQuery,
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
