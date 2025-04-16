import { Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { mapSessionJeuneDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import {
  aEteInscrit,
  SessionParDossierJeuneDto
} from 'src/infrastructure/clients/dto/milo.dto'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { JeuneSqlModel } from '../../../../infrastructure/sequelize/models/jeune.sql-model'

@Injectable()
export class GetSessionsJeuneMiloQueryGetter {
  private readonly logger: Logger

  constructor(
    private readonly oidcClient: OidcClient,
    private readonly miloClient: MiloClient
  ) {
    this.logger = new Logger('GetSessionsJeuneMiloQueryGetter')
  }

  async handle(
    idJeune: string,
    accessToken: string,
    options?: {
      periode?: { debut?: DateTime; fin?: DateTime }
      filtrerEstInscrit?: boolean
      pourConseiller?: boolean
    }
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
    const beneficiaire = await JeuneSqlModel.findByPk(idJeune, {
      include: [{ model: StructureMiloSqlModel, required: true }]
    })
    if (!beneficiaire?.idPartenaire || !beneficiaire.structureMilo)
      return success([])
    const timezoneDeLaStructureDuJeune = beneficiaire.structureMilo.timezone

    const sessionGetter = options?.pourConseiller
      ? this.getSessionsJeunePourConseiller.bind(this)
      : this.getSessionsJeune.bind(this)
    const resultSessionMiloClient = await sessionGetter(
      accessToken,
      beneficiaire.idPartenaire,
      options?.periode
    )

    if (isFailure(resultSessionMiloClient)) {
      this.logger.log(
        `Sessions venant de l'API en erreur : ${resultSessionMiloClient.error}`
      )
      return resultSessionMiloClient
    }

    const sessionsDuJeuneVenantDeLAPI = resultSessionMiloClient.data
    this.logger.log(
      `${sessionsDuJeuneVenantDeLAPI.length} Sessions venant de l'API`
    )

    const configurationsSessions = await SessionMiloSqlModel.findAll({
      where: {
        id: sessionsDuJeuneVenantDeLAPI.map(({ session }) =>
          session.id.toString()
        )
      }
    })

    const sessionsDuJeune: SessionParDossierJeuneDto[] =
      await recupererSessionsDuJeuneSelonFiltre(
        sessionsDuJeuneVenantDeLAPI,
        configurationsSessions,
        options?.filtrerEstInscrit
      )

    return success(
      sessionsDuJeune
        .map(sessionDuJeune =>
          mapSessionJeuneDtoToQueryModel(
            sessionDuJeune,
            beneficiaire.idPartenaire!,
            timezoneDeLaStructureDuJeune,
            configurationsSessions.find(
              ({ id }) => id === sessionDuJeune.session.id.toString()
            )
          )
        )
        .sort(compareSessionsByDebut)
    )
  }

  private async getSessionsJeune(
    accessToken: string,
    idPartenaire: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<SessionParDossierJeuneDto[]>> {
    const idpToken = await this.oidcClient.exchangeTokenJeune(
      accessToken,
      Core.Structure.MILO
    )

    return this.miloClient.getSessionsParDossierJeune(
      idpToken,
      idPartenaire,
      periode
    )
  }

  private async getSessionsJeunePourConseiller(
    accessToken: string,
    idPartenaire: string,
    periode?: { debut?: DateTime; fin?: DateTime }
  ): Promise<Result<SessionParDossierJeuneDto[]>> {
    const idpToken = await this.oidcClient.exchangeTokenConseillerMilo(
      accessToken
    )

    return this.miloClient.getSessionsParDossierJeunePourConseiller(
      idpToken,
      idPartenaire,
      periode
    )
  }
}

async function recupererSessionsDuJeuneSelonFiltre(
  sessionsDuJeuneVenantDeLAPI: SessionParDossierJeuneDto[],
  configurationsSessions: SessionMiloSqlModel[],
  filtreInscription?: boolean
): Promise<SessionParDossierJeuneDto[]> {
  switch (filtreInscription) {
    case false: {
      return (
        await recupererSessionsVisiblesPourLeJeune(
          sessionsDuJeuneVenantDeLAPI,
          configurationsSessions
        )
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
        await recupererSessionsVisiblesPourLeJeune(
          sessionsDuJeuneVenantDeLAPI,
          configurationsSessions
        )

      return concatSessionsVisiblesSansDoublon(
        sessionsAuxquellesLeJeuneEstInscrit,
        sessionsVisiblesPourLeJeune
      )
    }
  }
}

function recupererSessionsAuxquellesLeJeuneEstInscrit(
  sessions: SessionParDossierJeuneDto[]
): SessionParDossierJeuneDto[] {
  return sessions.filter(({ sessionInstance }) => aEteInscrit(sessionInstance))
}

async function recupererSessionsVisiblesPourLeJeune(
  sessions: SessionParDossierJeuneDto[],
  configurationsSessions: SessionMiloSqlModel[]
): Promise<SessionParDossierJeuneDto[]> {
  const idsSessionsVisibles = configurationsSessions
    .filter(({ estVisible }) => estVisible)
    .map(({ id }) => id)

  return sessions.filter(session =>
    idsSessionsVisibles.includes(session.session.id.toString())
  )
}

function concatSessionsVisiblesSansDoublon(
  sessionsAuxquellesLeJeuneEstInscrit: SessionParDossierJeuneDto[],
  sessionsVisiblesPourLeJeune: SessionParDossierJeuneDto[]
): SessionParDossierJeuneDto[] {
  const sessions = [...sessionsAuxquellesLeJeuneEstInscrit]

  sessionsVisiblesPourLeJeune.forEach(sessionVisible => {
    if (
      sessionsAuxquellesLeJeuneEstInscrit.find(
        sessionInscrit =>
          sessionInscrit.session.id === sessionVisible.session.id
      )
    )
      return

    sessions.push(sessionVisible)
  })

  return sessions
}

function compareSessionsByDebut(
  session1: SessionJeuneMiloQueryModel,
  session2: SessionJeuneMiloQueryModel
): number {
  const date1 = DateTime.fromISO(session1.dateHeureDebut)
  const date2 = DateTime.fromISO(session2.dateHeureDebut)
  return date1.toMillis() - date2.toMillis()
}
