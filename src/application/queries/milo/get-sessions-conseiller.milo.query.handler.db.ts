import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { mapSessionConseillerDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { Conseiller } from 'src/domain/milo/conseiller'
import {
  ConseillerMilo,
  ConseillerMiloRepositoryToken
} from 'src/domain/milo/conseiller.milo.db'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { PlanificateurService } from 'src/domain/planificateur'
import { SessionConseillerDetailDto } from 'src/infrastructure/clients/dto/milo.dto'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateService } from 'src/utils/date-service'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { SessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import estEmargeeMaisPasClose = SessionMilo.estEmargeeMaisPasClose

const NB_MOIS_PASSES_SESSIONS_A_CLORE = 3

export interface GetSessionsConseillerMiloQuery extends Query {
  idConseiller: string
  accessToken: string
  dateDebut?: DateTime
  dateFin?: DateTime
  filtrerAClore?: boolean
}

@Injectable()
export class GetSessionsConseillerMiloQueryHandler extends QueryHandler<
  GetSessionsConseillerMiloQuery,
  Result<SessionConseillerMiloQueryModel[]>
> {
  constructor(
    private readonly configService: ConfigService,
    @Inject(ConseillerMiloRepositoryToken)
    private readonly conseillerMiloRepository: Conseiller.Milo.Repository,
    private readonly oidcClient: OidcClient,
    private readonly miloClient: MiloClient,
    private readonly dateService: DateService,
    private readonly planificateurService: PlanificateurService,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetSessionsConseillerMiloQueryHandler')
  }

  async handle(
    query: GetSessionsConseillerMiloQuery
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) return resultConseiller
    const conseiller = resultConseiller.data

    const resultSessionsDtos = await this.getSessionsDtos(
      query,
      conseiller.structure
    )
    if (isFailure(resultSessionsDtos)) return resultSessionsDtos

    const sessionsQueryModels = await this.buildQueryModels(
      resultSessionsDtos.data,
      conseiller.structure
    )

    this.planifierClotureSessions(sessionsQueryModels, conseiller)

    if (query.filtrerAClore)
      return success(
        sessionsQueryModels.filter(
          ({ statut }) => statut === SessionMilo.Statut.A_CLOTURER
        )
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

  private async getSessionsDtos(
    query: GetSessionsConseillerMiloQuery,
    structureMilo: ConseillerMilo.Structure
  ): Promise<Result<SessionConseillerDetailDto[]>> {
    const idpToken = await this.oidcClient.exchangeTokenConseillerMilo(
      query.accessToken
    )

    return this.miloClient.getSessionsConseillerParStructure(
      idpToken,
      structureMilo.id,
      structureMilo.timezone,
      { periode: this.buildPeriode(query, NB_MOIS_PASSES_SESSIONS_A_CLORE) }
    )
  }

  private async buildQueryModels(
    sessionsDtos: SessionConseillerDetailDto[],
    structureMilo: ConseillerMilo.Structure
  ): Promise<SessionConseillerMiloQueryModel[]> {
    const sessionsSqlModels = await SessionMiloSqlModel.findAll({
      where: { idStructureMilo: structureMilo.id }
    })

    return sessionsDtos.map(sessionMilo => {
      const sessionSqlModel = sessionsSqlModels.find(
        ({ id }) => id === sessionMilo.session.id.toString()
      )
      return mapSessionConseillerDtoToQueryModel(
        sessionMilo,
        structureMilo.timezone,
        this.dateService.now(),
        sessionSqlModel
      )
    })
  }

  private buildPeriode(
    query: GetSessionsConseillerMiloQuery,
    maxMoisSessionsAClore: number
  ): {
    debut?: DateTime
    fin?: DateTime
  } {
    if (query.filtrerAClore)
      return {
        debut: this.dateService.now().minus({ months: maxMoisSessionsAClore })
      }
    else return { debut: query.dateDebut, fin: query.dateFin }
  }

  private planifierClotureSessions(
    sessionsQueryModels: SessionConseillerMiloQueryModel[],
    conseiller: ConseillerMilo
  ): void {
    const idsSessionsAClore: string[] = []
    sessionsQueryModels.forEach(queryModel => {
      if (estEmargeeMaisPasClose(queryModel.statut)) {
        idsSessionsAClore.push(queryModel.id)
        queryModel.statut = SessionMilo.Statut.CLOTUREE
      }
    })

    if (idsSessionsAClore.length) {
      this.planificateurService.ajouterJobClotureSessions(
        idsSessionsAClore,
        conseiller.structure.id,
        this.dateService.now(),
        this.logger
      )
    }
  }
}
