import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  Result,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { estMilo } from '../../../domain/core'
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
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
    const { id: idStructureMilo, timezone: timezoneStructure } =
      resultConseiller.data.structure

    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      query.token
    )

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
          ({ id }) => id === sessionMilo.session.id.toString()
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
