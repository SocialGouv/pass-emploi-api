import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { mapSessionDtoToQueryModel } from '../query-mappers/milo.mappers'
import { SessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'

export interface GetSessionsMiloQuery extends Query {
  idConseiller: string
  token: string
  dateDebut?: DateTime
  dateFin?: DateTime
}

@Injectable()
export class GetSessionsMiloQueryHandler extends QueryHandler<
  GetSessionsMiloQuery,
  Result<SessionConseillerMiloQueryModel[]>
> {
  constructor(
    private miloClient: MiloClient,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private keycloakClient: KeycloakClient
  ) {
    super('GetSessionsMiloQueryHandler')
  }

  async handle(
    query: GetSessionsMiloQuery
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const { id: idStructure, timezone: timezoneStructure } =
      resultConseiller.data.structure

    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      query.token
    )

    const idStructureMilo = idStructure
    const [resultSessionMilo, sessionsSqlModels] = await Promise.all([
      this.miloClient.getSessionsConseiller(
        idpToken,
        idStructureMilo,
        timezoneStructure,
        query.dateDebut,
        query.dateFin
      ),
      SessionMiloSqlModel.findAll({ where: { idStructureMilo } })
    ])
    if (isFailure(resultSessionMilo)) {
      return resultSessionMilo
    }

    const sessionsQueryModels = resultSessionMilo.data.sessions.map(
      sessionMilo => {
        const sessionSqlModel = sessionsSqlModels.find(
          ({ id }) => id === sessionMilo.session.id.toString(10)
        )
        return mapSessionDtoToQueryModel(
          sessionMilo,
          sessionSqlModel?.estVisible ?? false,
          timezoneStructure
        )
      }
    )
    return success(sessionsQueryModels)
  }

  async authorize(
    query: GetSessionsMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
