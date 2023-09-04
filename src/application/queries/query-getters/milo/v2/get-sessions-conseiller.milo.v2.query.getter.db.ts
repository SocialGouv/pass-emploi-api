import { Injectable } from '@nestjs/common'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { DateService } from '../../../../../utils/date-service'
import { DateTime } from 'luxon'
import {
  isFailure,
  Result,
  success
} from '../../../../../building-blocks/types/result'
import { SessionConseillerMiloQueryModel } from '../../../query-models/sessions.milo.query.model'
import {
  ListeSessionsConseillerMiloDto,
  SessionConseillerDetailDto
} from '../../../../../infrastructure/clients/dto/milo.dto'
import { SessionMilo } from '../../../../../domain/milo/session.milo'
import { mapSessionConseillerDtoToQueryModel } from '../../../query-mappers/milo.mappers'
import { SessionMiloSqlModel } from '../../../../../infrastructure/sequelize/models/session-milo.sql-model'

const NOMBRE_MAX_SESSIONS_PAR_PAGE = 50

@Injectable()
export class GetSessionsConseillerMiloV2QueryGetter {
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
      filtrerAClore?: boolean
    }
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      accessToken
    )

    // FIXME remettre au 2023-08-01
    const periode = {
      dateDebut: DateTime.fromISO('2023-08-01')
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

    // la on recupere toutes les sessions
    const resultatSessionsPourPagination =
      await this.getAllSessionsForPagination(
        resultSessionMiloClient.data,
        idpToken,
        idStructureMilo,
        timezoneStructure,
        periode.dateDebut
      )

    const sessionsSqlModels = await SessionMiloSqlModel.findAll({
      where: { idStructureMilo }
    })

    // TODO passer toutes les sessions recuperer de Milo ( mapper sur les _resultatSessionsPourPagination)
    const sessionsQueryModels = resultatSessionsPourPagination.map(
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

  async getAllSessionsForPagination(
    resultSessionsMiloClient: ListeSessionsConseillerMiloDto,
    idpToken: string,
    idStructureMilo: string,
    timezoneStructure: string,
    dateDebut: DateTime
  ): Promise<SessionConseillerDetailDto[]> {
    const sessions: SessionConseillerDetailDto[] =
      resultSessionsMiloClient.sessions
    if (calculerNbPageMiloClient(resultSessionsMiloClient.nbSessions) > 1) {
      for (
        let i = 2;
        i <= calculerNbPageMiloClient(resultSessionsMiloClient.nbSessions);
        i++
      ) {
        const resultMiloClientParPage =
          await this.miloClient.getSessionsConseiller(
            idpToken,
            idStructureMilo,
            timezoneStructure,
            { periode: { dateDebut }, page: i }
          )

        if (isFailure(resultMiloClientParPage)) {
          // TODO gerer erreur
          // TODO gerer erreur
          // TODO gerer erreur
          return []
        }

        sessions.push(...resultMiloClientParPage.data.sessions)
      }
    }
    return sessions
  }
}

function filtrerSessionAClore(
  sessionQueryModels: SessionConseillerMiloQueryModel
): boolean {
  return sessionQueryModels.statut === SessionMilo.Statut.A_CLOTURER
}

function calculerNbPageMiloClient(nbSessions: number): number {
  return Math.ceil(nbSessions / NOMBRE_MAX_SESSIONS_PAR_PAGE)
}
