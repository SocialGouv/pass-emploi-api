import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  Result,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { estMilo } from '../../../domain/core'
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
import { StructureMiloSqlModel } from '../../../infrastructure/sequelize/models/structure-milo.sql-model'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { DetailSessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { mapDetailSessionDtoToQueryModel } from '../query-mappers/milo.mappers'

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
    const idStructure = resultConseiller.data.idStructure
    const structure = await StructureMiloSqlModel.findByPk(idStructure)
    const timezoneStructure = structure!.timezone ?? undefined

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

    return success(
      mapDetailSessionDtoToQueryModel(result.data, timezoneStructure)
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
