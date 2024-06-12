import { Injectable } from '@nestjs/common'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client.db'
import { MiloClient } from '../../../../infrastructure/clients/milo-client'
import { DateTime } from 'luxon'
import {
  isFailure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { ListeSessionsConseillerMiloDto } from '../../../../infrastructure/clients/dto/milo.dto'
import { SessionMiloSqlModel } from '../../../../infrastructure/sequelize/models/session-milo.sql-model'
import { mapSessionConseillerDtoToQueryModel } from '../../query-mappers/milo.mappers'
import { DateService } from '../../../../utils/date-service'
import { SessionConseillerMiloQueryModel } from '../../query-models/sessions.milo.query.model'
import { SessionMilo } from '../../../../domain/milo/session.milo'

export const DATE_DEBUT_SESSIONS_A_CLORE = '2023-10-01T00:00:00Z'

@Injectable()
export class GetSessionsConseillerMiloQueryGetter {
  constructor(
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient,
    private readonly dateService: DateService
  ) {}

  async handle(
    accessToken: string,
    idStructureMilo: string,
    timezoneStructure: string,
    options?: {
      periode?: { debut?: DateTime; fin?: DateTime }
      filtrerAClore?: boolean
    }
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      accessToken
    )

    let periode
    if (options && options.filtrerAClore) {
      periode = {
        dateDebut: DateTime.fromISO(DATE_DEBUT_SESSIONS_A_CLORE),
        dateFin: undefined
      }
    }
    if (
      options &&
      options.periode &&
      (options.periode.debut || options.periode.fin)
    )
      periode = {
        dateDebut: options.periode.debut,
        dateFin: options.periode.fin
      }

    const resultSessionMiloClient: Result<ListeSessionsConseillerMiloDto> =
      await this.miloClient.getSessionsConseiller(
        idpToken,
        idStructureMilo,
        timezoneStructure,
        { periode }
      )

    if (isFailure(resultSessionMiloClient)) {
      return resultSessionMiloClient
    }

    const sessionsSqlModels = await SessionMiloSqlModel.findAll({
      where: { idStructureMilo }
    })

    const sessionsQueryModels = resultSessionMiloClient.data.sessions.map(
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

    if (options?.filtrerAClore)
      return success(sessionsQueryModels.filter(filtrerSessionAClore))
    return success(sessionsQueryModels)
  }
}

function filtrerSessionAClore(
  sessionQueryModels: SessionConseillerMiloQueryModel
): boolean {
  return sessionQueryModels.statut === SessionMilo.Statut.A_CLOTURER
}
