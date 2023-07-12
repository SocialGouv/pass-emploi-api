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
import { mapDetailSessionConseillerDtoToQueryModel } from '../query-mappers/milo.mappers'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DetailSessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { JeuneMilo } from '../../../domain/milo/jeune.milo'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetDetailSessionConseillerMiloQuery extends Query {
  idSession: string
  idConseiller: string
  token: string
}

@Injectable()
export class GetDetailSessionConseillerMiloQueryHandler extends QueryHandler<
  GetDetailSessionConseillerMiloQuery,
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
    query: GetDetailSessionConseillerMiloQuery
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

    const listeInscrits =
      await this.miloClient.getListeInscritsSessionConseillers(
        idpToken,
        query.idSession
      )
    if (isFailure(listeInscrits)) {
      return listeInscrits
    }

    console.log('------------------------------------------------')
    console.log(listeInscrits)

    const jeunes = await JeuneSqlModel.findAll({
      where: {
        idPartenaire: listeInscrits.data.map(unInscrit =>
          unInscrit.idDossier.toString()
        )
      },
      attributes: ['id', 'idPartenaire']
    })

    console.log(jeunes)

    const sessionSqlModel = await SessionMiloSqlModel.findByPk(
      result.data.session.id.toString()
    )
    const estVisible = sessionSqlModel?.estVisible ?? false

    return success(
      mapDetailSessionConseillerDtoToQueryModel(
        result.data,
        listeInscrits.data,
        jeunes,
        estVisible,
        timezoneStructure
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
