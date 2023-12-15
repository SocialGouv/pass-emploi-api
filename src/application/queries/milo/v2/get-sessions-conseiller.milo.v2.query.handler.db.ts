import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/milo/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerAuthorizer } from '../../../authorizers/conseiller-authorizer'
import { ConfigService } from '@nestjs/config'
import {
  SessionConseillerMiloQueryModel,
  SessionsConseillerV2QueryModel
} from '../../query-models/sessions.milo.query.model'
import { GetSessionsConseillerMiloV2QueryGetter } from '../../query-getters/milo/v2/get-sessions-conseiller.milo.v2.query.getter.db'
import { ConseillerMiloRepositoryToken } from '../../../../domain/milo/conseiller.milo.db'
import { sessionsMiloSontActiveesPourLeConseiller } from '../../../../utils/feature-flip-session-helper'

export interface GetSessionsConseillerMiloV2Query extends Query {
  idConseiller: string
  accessToken: string
  page?: number
  filtrerAClore?: boolean
}

const NOMBRE_SESSIONS_PAGE = 10

@Injectable()
export class GetSessionsConseillerMiloV2QueryHandler extends QueryHandler<
  GetSessionsConseillerMiloV2Query,
  Result<SessionsConseillerV2QueryModel>
> {
  constructor(
    private getSessionsConseillerMiloV2QueryGetter: GetSessionsConseillerMiloV2QueryGetter,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private configService: ConfigService
  ) {
    super('GetSessionsConseillerMiloQueryHandler')
  }

  async handle(
    query: GetSessionsConseillerMiloV2Query
  ): Promise<Result<SessionsConseillerV2QueryModel>> {
    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }

    if (
      !sessionsMiloSontActiveesPourLeConseiller(
        this.configService,
        resultConseiller.data
      )
    ) {
      return success({
        pagination: {
          page: 1,
          limit: 0,
          total: 0
        },
        resultats: []
      })
    }

    const { id: idStructureMilo, timezone: timezoneStructure } =
      resultConseiller.data.structure

    const resultSessionsMiloFromQueryGetter: Result<
      SessionConseillerMiloQueryModel[]
    > = await this.getSessionsConseillerMiloV2QueryGetter.handle(
      query.accessToken,
      idStructureMilo,
      timezoneStructure,
      { filtrerAClore: query.filtrerAClore }
    )

    if (isFailure(resultSessionsMiloFromQueryGetter)) {
      return resultSessionsMiloFromQueryGetter
    }

    const nbSessions = resultSessionsMiloFromQueryGetter.data.length
    const getPage = query.page ?? 1

    const sessionsParPage = getPageSessions(
      resultSessionsMiloFromQueryGetter.data,
      getPage
    )

    return success({
      pagination: {
        page: getPage,
        limit: NOMBRE_SESSIONS_PAGE,
        total: nbSessions
      },
      resultats: sessionsParPage
    })
  }

  async authorize(
    query: GetSessionsConseillerMiloV2Query,
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

function getPageSessions(
  sessions: SessionConseillerMiloQueryModel[],
  page: number
): SessionConseillerMiloQueryModel[] {
  const premiereSessionPage = NOMBRE_SESSIONS_PAGE * (page - 1)
  const premiereSessionPageSuivante = page * NOMBRE_SESSIONS_PAGE
  return sessions.slice(premiereSessionPage, premiereSessionPageSuivante)
}
