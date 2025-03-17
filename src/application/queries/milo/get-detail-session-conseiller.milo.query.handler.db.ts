import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { Conseiller } from 'src/domain/milo/conseiller'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo.db'
import { PlanificateurService } from 'src/domain/planificateur'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { DateService } from 'src/utils/date-service'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from '../../../domain/milo/session.milo'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { mapSessionToDetailSessionConseillerQueryModel } from '../query-mappers/milo.mappers'
import { DetailSessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'

export interface GetDetailSessionConseillerMiloQuery extends Query {
  idSession: string
  idConseiller: string
  accessToken: string
}

@Injectable()
export class GetDetailSessionConseillerMiloQueryHandler extends QueryHandler<
  GetDetailSessionConseillerMiloQuery,
  Result<DetailSessionConseillerMiloQueryModel>
> {
  constructor(
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    @Inject(SessionMiloRepositoryToken)
    private sessionRepository: SessionMilo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private oidcClient: OidcClient,
    private dateService: DateService,
    private readonly planificateurService: PlanificateurService
  ) {
    super('GetDetailSessionMiloQueryHandler')
  }

  async handle(
    query: GetDetailSessionConseillerMiloQuery
  ): Promise<Result<DetailSessionConseillerMiloQueryModel>> {
    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const { structure } = resultConseiller.data

    const idpToken = await this.oidcClient.exchangeTokenConseillerMilo(
      query.accessToken
    )

    const resultatSession = await this.sessionRepository.getForConseiller(
      query.idSession,
      structure,
      idpToken
    )
    if (isFailure(resultatSession)) return resultatSession
    const session = resultatSession.data

    const queryModel = mapSessionToDetailSessionConseillerQueryModel(
      session,
      this.dateService.now()
    )

    if (SessionMilo.estEmargeeMaisPasClose(queryModel.session.statut)) {
      this.planifierClotureSession(session)
      queryModel.session.statut = SessionMilo.Statut.CLOTUREE
    }

    return success(queryModel)
  }

  async authorize(
    query: GetDetailSessionConseillerMiloQuery,
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

  private planifierClotureSession(session: SessionMilo): void {
    this.planificateurService.ajouterJobClotureSessions(
      [session.id],
      session.idStructureMilo,
      this.dateService.now(),
      this.logger
    )
  }
}
