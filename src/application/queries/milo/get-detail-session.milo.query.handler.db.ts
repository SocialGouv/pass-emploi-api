import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { mapDetailSessionDtoToQueryModel } from '../query-mappers/milo.mappers'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DetailSessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'

export interface GetDetailSessionMiloQuery extends Query {
  idSession: string
  idConseiller: string
  token: string
}

@Injectable()
export class GetDetailSessionMiloQueryHandler extends QueryHandler<
  GetDetailSessionMiloQuery,
  Result<DetailSessionConseillerMiloQueryModel>
> {
  constructor(
    private miloClient: MiloClient,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private keycloakClient: KeycloakClient
  ) {
    super('GetDetailSessionMiloQueryHandler')
  }

  async handle(
    query: GetDetailSessionMiloQuery
  ): Promise<Result<DetailSessionConseillerMiloQueryModel>> {
    const resultConseiller = await this.conseillerRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const { timezone: timezoneStructure } = resultConseiller.data.structure

    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      query.token
    )

    const result = await this.miloClient.getDetailSessionConseiller(
      idpToken,
      query.idSession
    )
    if (isFailure(result)) {
      return result
    }

    const sessionSqlModel = await SessionMiloSqlModel.findByPk(
      result.data.session.id.toString()
    )
    const estVisible = sessionSqlModel?.estVisible ?? false

    return success(
      mapDetailSessionDtoToQueryModel(
        result.data,
        estVisible,
        timezoneStructure
      )
    )
  }

  async authorize(
    query: GetDetailSessionMiloQuery,
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
