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
import { mapSessionConseillerDtoToQueryModel } from '../query-mappers/milo.mappers'
import { SessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateService } from 'src/utils/date-service'

export interface GetSessionsConseillerMiloQuery extends Query {
  idConseiller: string
  token: string
  dateDebut?: DateTime
  dateFin?: DateTime
}

@Injectable()
export class GetSessionsConseillerMiloQueryHandler extends QueryHandler<
  GetSessionsConseillerMiloQuery,
  Result<SessionConseillerMiloQueryModel[]>
> {
  constructor(
    private miloClient: MiloClient,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private keycloakClient: KeycloakClient,
    private dateService: DateService
  ) {
    super('GetSessionsConseillerMiloQueryHandler')
  }

  async handle(
    query: GetSessionsConseillerMiloQuery
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
        const dateCloture = sessionSqlModel?.dateCloture
        return mapSessionConseillerDtoToQueryModel(
          sessionMilo,
          sessionSqlModel?.estVisible ?? false,
          timezoneStructure,
          this.dateService.now(),
          dateCloture ? DateTime.fromJSDate(dateCloture) : undefined
        )
      }
    )
    return success(sessionsQueryModels)
  }

  async authorize(
    query: GetSessionsConseillerMiloQuery,
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
