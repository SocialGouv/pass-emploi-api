import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/milo/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo.db'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from '../../../domain/milo/session.milo'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { mapSessionToDetailSessionConseillerQueryModel } from '../query-mappers/milo.mappers'
import { DetailSessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { DateService } from 'src/utils/date-service'

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
    private conseillerRepository: Conseiller.Milo.Repository,
    @Inject(SessionMiloRepositoryToken)
    private sessionRepository: SessionMilo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private keycloakClient: KeycloakClient,
    private dateService: DateService
  ) {
    super('GetDetailSessionMiloQueryHandler')
  }

  async handle(
    query: GetDetailSessionConseillerMiloQuery
  ): Promise<Result<DetailSessionConseillerMiloQueryModel>> {
    const resultConseiller = await this.conseillerRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const { structure } = resultConseiller.data

    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      query.accessToken
    )

    const resultat = await this.sessionRepository.getForConseiller(
      query.idSession,
      structure,
      idpToken
    )
    if (isFailure(resultat)) return resultat

    return success(
      mapSessionToDetailSessionConseillerQueryModel(
        resultat.data,
        this.dateService.now()
      )
    )
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
}
