import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { mapSessionJeuneDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { SessionMilo } from 'src/domain/milo/session.milo'
import {
  ListeSessionsJeuneMiloDto,
  SessionJeuneListeDto
} from 'src/infrastructure/clients/dto/milo.dto'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'

@Injectable()
export class GetSessionsJeuneMiloQueryGetter {
  constructor(
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient
  ) {}

  async handle(
    idPartenaire: string,
    accessToken: string,
    options?: {
      periode?: { debut?: DateTime; fin?: DateTime }
      filtrerEstInscrit?: boolean
      pourConseiller?: boolean
    }
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
    let resultSessionMiloClient: Result<ListeSessionsJeuneMiloDto>
    if (options?.pourConseiller) {
      resultSessionMiloClient = await this.getSessionsJeunePourConseiller(
        accessToken,
        idPartenaire,
        options?.periode
      )
    } else {
      resultSessionMiloClient = await this.getSessionsJeune(
        accessToken,
        idPartenaire,
        options?.periode
      )
    }

    if (isFailure(resultSessionMiloClient)) {
      return resultSessionMiloClient
    }

    const sessionsVisiblesQueryModels = await recupererTimezoneSessionsVisibles(
      resultSessionMiloClient.data.sessions,
      idPartenaire
    )

    if (options?.filtrerEstInscrit)
      return success(trierSessionsAvecInscriptions(sessionsVisiblesQueryModels))
    return success(sessionsVisiblesQueryModels)
  }

  private async getSessionsJeune(
    accessToken: string,
    idPartenaire: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<ListeSessionsJeuneMiloDto>> {
    const idpToken = await this.keycloakClient.exchangeTokenJeune(
      accessToken,
      Core.Structure.MILO
    )

    return this.miloClient.getSessionsJeune(idpToken, idPartenaire, periode)
  }

  private async getSessionsJeunePourConseiller(
    accessToken: string,
    idPartenaire: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<ListeSessionsJeuneMiloDto>> {
    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      accessToken
    )

    return this.miloClient.getSessionsJeunePourConseiller(
      idpToken,
      idPartenaire,
      periode
    )
  }
}

async function recupererTimezoneSessionsVisibles(
  sessionsMilo: SessionJeuneListeDto[],
  idDossier: string
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
        idDossier,
        mapSessionsVisiblesTimezone.get(session.session.id.toString())!
      )
    )
}

async function mapperSessionsVisiblesToTimezone(
  sessionsMiloClient: SessionJeuneListeDto[]
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

function trierSessionsAvecInscriptions(
  sessions: SessionJeuneMiloQueryModel[]
): SessionJeuneMiloQueryModel[] {
  return sessions
    .filter(({ inscription }) =>
      SessionMilo.Inscription.estInscrit(inscription)
    )
    .sort(compareSessionsByDebut)
}

function compareSessionsByDebut(
  session1: SessionJeuneMiloQueryModel,
  session2: SessionJeuneMiloQueryModel
): number {
  const date1 = DateTime.fromISO(session1.dateHeureDebut)
  const date2 = DateTime.fromISO(session2.dateHeureDebut)
  return date1.toMillis() - date2.toMillis()
}
