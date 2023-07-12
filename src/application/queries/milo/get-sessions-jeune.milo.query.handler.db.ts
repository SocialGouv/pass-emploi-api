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
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { estMilo } from 'src/domain/core'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune/jeune'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { mapSessionJeuneDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionJeuneDetailDto } from 'src/infrastructure/clients/dto/milo.dto'

export interface GetSessionsJeuneMiloQuery extends Query {
  idJeune: string
  token: string
}

@Injectable()
export class GetSessionsJeuneMiloQueryHandler extends QueryHandler<
  GetSessionsJeuneMiloQuery,
  Result<SessionJeuneMiloQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetSessionsJeuneMiloQueryHandler')
  }

  async handle(
    query: GetSessionsJeuneMiloQuery
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
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

    const resultSessionMiloClient = await this.miloClient.getSessionsJeune(
      idpToken,
      jeune.idPartenaire
    )

    if (isFailure(resultSessionMiloClient)) {
      return resultSessionMiloClient
    }

    const sessionsVisiblesQueryModels = await recupererTimezoneSessionsVisibles(
      resultSessionMiloClient.data.sessions
    )
    return success(sessionsVisiblesQueryModels)
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

async function recupererTimezoneSessionsVisibles(
  sessionsMilo: SessionJeuneDetailDto[]
): Promise<SessionJeuneMiloQueryModel[]> {
  const mapSessionsVisiblesTimezone = await mapperSessionsVisiblesToTimezone(
    sessionsMilo
  )

  return sessionsMilo
    .filter(({ session: { id } }) =>
      mapSessionsVisiblesTimezone.has(id.toString())
    )
    .map(session =>
      mapSessionJeuneDtoToQueryModel(
        session,
        mapSessionsVisiblesTimezone.get(session.session.id.toString())!
      )
    )
}

async function mapperSessionsVisiblesToTimezone(
  sessionsMiloClient: SessionJeuneDetailDto[]
): Promise<Map<string, string>> {
  const sessionsVisibles = await SessionMiloSqlModel.findAll({
    where: {
      id: sessionsMiloClient.map(session => session.session.id.toString()),
      estVisible: true
    },
    include: [{ model: StructureMiloSqlModel, as: 'structure' }]
  })

  return sessionsVisibles.reduce((map, sessionVisible) => {
    map.set(sessionVisible.id, sessionVisible.structure!.timezone)
    return map
  }, new Map<string, string>())
}
