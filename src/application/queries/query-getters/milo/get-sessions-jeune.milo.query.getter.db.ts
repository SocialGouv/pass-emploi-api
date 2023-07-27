import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import {
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
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
import { SessionJeuneListeDto } from 'src/infrastructure/clients/dto/milo.dto'
import { DateTime, Interval } from 'luxon'
import { SessionMilo } from 'src/domain/milo/session.milo'
import estInscrit = SessionMilo.Inscription.estInscrit

export interface GetSessionsJeuneMiloQuery extends Query {
  idJeune: string
  token: string
  periode?: Interval
}

@Injectable()
export class GetSessionsJeuneMiloQueryGetter {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly keycloakClient: KeycloakClient,
    private readonly miloClient: MiloClient
  ) {}

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
      jeune.idPartenaire,
      query.periode?.start,
      query.periode?.end
    )

    if (isFailure(resultSessionMiloClient)) {
      return resultSessionMiloClient
    }

    const sessionsVisiblesQueryModels = await recupererTimezoneSessionsVisibles(
      resultSessionMiloClient.data.sessions,
      jeune.idPartenaire
    )
    return success(sessionsVisiblesQueryModels)
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

export function sessionsAvecInscriptionTriees(
  sessionsResult: Result<SessionJeuneMiloQueryModel[]>
): SessionJeuneMiloQueryModel[] {
  if (isFailure(sessionsResult)) return []
  return sessionsResult.data
    .filter(({ inscription }) => estInscrit(inscription))
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
