import { Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { mapSessionJeuneDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import {
  ListeSessionsJeuneMiloDto,
  MILO_INSCRIT,
  MILO_PRESENT,
  SessionJeuneListeDto
} from 'src/infrastructure/clients/dto/milo.dto'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { JeuneSqlModel } from '../../../../infrastructure/sequelize/models/jeune.sql-model'

@Injectable()
export class GetSessionsJeuneMiloQueryGetter {
  private readonly logger: Logger

  constructor(
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient
  ) {
    this.logger = new Logger('GetSessionsJeuneMiloQueryGetter')
  }

  async handle(
    idJeune: string,
    idPartenaire: string,
    accessToken: string,
    options?: {
      periode?: { debut?: DateTime; fin?: DateTime }
      filtrerEstInscrit?: boolean
      pourConseiller?: boolean
    }
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
    const timezoneDeLaStructureDuJeune = (
      await JeuneSqlModel.findByPk(idJeune, {
        include: [{ model: StructureMiloSqlModel, required: true }]
      })
    )?.structureMilo?.timezone

    if (!timezoneDeLaStructureDuJeune) {
      return success([])
    }

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
      this.logger.log(
        `Sessions venant de l'API en erreur : ${resultSessionMiloClient.error}`
      )
      return resultSessionMiloClient
    }

    this.logger.log(
      `${resultSessionMiloClient.data.sessions.length} Sessions venant de l'API`
    )

    const sessionsDuJeune: SessionJeuneListeDto[] =
      await recupererSessionsDuJeuneSelonFiltre(
        resultSessionMiloClient.data.sessions,
        options?.filtrerEstInscrit
      )

    return success(
      sessionsDuJeune
        .map(sessionDuJeune =>
          mapSessionJeuneDtoToQueryModel(
            sessionDuJeune,
            idPartenaire,
            timezoneDeLaStructureDuJeune
          )
        )
        .sort(compareSessionsByDebut)
    )
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

async function recupererSessionsDuJeuneSelonFiltre(
  sessionsDuJeuneVenantDeLAPI: SessionJeuneListeDto[],
  filtreInscription?: boolean
): Promise<SessionJeuneListeDto[]> {
  switch (filtreInscription) {
    case false: {
      return (
        await recupererSessionsVisiblesPourLeJeune(sessionsDuJeuneVenantDeLAPI)
      ).filter(sessionVisible => sessionVisible.sessionInstance === undefined)
    }
    case true: {
      return recupererSessionsAuxquellesLeJeuneEstInscrit(
        sessionsDuJeuneVenantDeLAPI
      )
    }
    default: {
      const sessionsAuxquellesLeJeuneEstInscrit =
        recupererSessionsAuxquellesLeJeuneEstInscrit(
          sessionsDuJeuneVenantDeLAPI
        )
      const sessionsVisiblesPourLeJeune =
        await recupererSessionsVisiblesPourLeJeune(sessionsDuJeuneVenantDeLAPI)
      const sessionsVisiblesAuJeuneSansDoublons =
        recupererSessionsVisiblesPourLeJeuneSansDoublons(
          sessionsVisiblesPourLeJeune,
          sessionsAuxquellesLeJeuneEstInscrit
        )
      return sessionsAuxquellesLeJeuneEstInscrit.concat(
        sessionsVisiblesAuJeuneSansDoublons
      )
    }
  }
}

function recupererSessionsAuxquellesLeJeuneEstInscrit(
  sessions: SessionJeuneListeDto[]
): SessionJeuneListeDto[] {
  return sessions.filter(
    session =>
      session.sessionInstance?.statut === MILO_INSCRIT ||
      session.sessionInstance?.statut === MILO_PRESENT
  )
}

async function recupererSessionsVisiblesPourLeJeune(
  sessions: SessionJeuneListeDto[]
): Promise<SessionJeuneListeDto[]> {
  const idsSessionsVisibles = (
    await SessionMiloSqlModel.findAll({
      where: {
        id: sessions.map(session => session.session.id.toString()),
        estVisible: true
      }
    })
  ).map(sessionVisibleSql => sessionVisibleSql.id)

  return sessions.filter(session =>
    idsSessionsVisibles.includes(session.session.id.toString())
  )
}

function recupererSessionsVisiblesPourLeJeuneSansDoublons(
  sessionsVisiblesPourLeJeune: SessionJeuneListeDto[],
  sessionsAuxquellesLeJeuneEstInscrit: SessionJeuneListeDto[]
): SessionJeuneListeDto[] {
  return sessionsVisiblesPourLeJeune.filter(
    sessionVisible =>
      sessionsAuxquellesLeJeuneEstInscrit.find(
        sessionInscrit =>
          sessionInscrit.session.id === sessionVisible.session.id
      ) === undefined
  )
}

function compareSessionsByDebut(
  session1: SessionJeuneMiloQueryModel,
  session2: SessionJeuneMiloQueryModel
): number {
  const date1 = DateTime.fromISO(session1.dateHeureDebut)
  const date2 = DateTime.fromISO(session2.dateHeureDebut)
  return date1.toMillis() - date2.toMillis()
}
