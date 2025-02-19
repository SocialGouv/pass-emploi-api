import { Injectable } from '@nestjs/common'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { mapDetailSessionJeuneDtoToQueryModel } from 'src/application/queries/query-mappers/milo.mappers'
import { DetailSessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import {
  JeuneMiloSansIdDossier,
  JeuneMiloSansStructure
} from 'src/building-blocks/types/domain-error'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetDetailSessionJeuneMiloQuery extends Query {
  idSession: string
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetDetailSessionJeuneMiloQueryHandler extends QueryHandler<
  GetDetailSessionJeuneMiloQuery,
  Result<DetailSessionJeuneMiloQueryModel>
> {
  constructor(
    private readonly oidcClient: OidcClient,
    private readonly miloClient: MiloClient,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetDetailSessionJeuneMiloQueryHandler')
  }

  async handle(
    query: GetDetailSessionJeuneMiloQuery
  ): Promise<Result<DetailSessionJeuneMiloQueryModel>> {
    const jeune = await JeuneSqlModel.findByPk(query.idJeune, {
      include: [{ model: StructureMiloSqlModel, required: true }]
    })
    const timezoneDeLaStructureDuJeune = jeune?.structureMilo?.timezone
    if (!timezoneDeLaStructureDuJeune) {
      return failure(new JeuneMiloSansStructure(query.idJeune))
    }
    if (!jeune.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(query.idJeune))
    }

    const idpToken = await this.oidcClient.exchangeTokenJeune(
      query.accessToken,
      jeune.structure
    )
    const resultDetailSessionMiloClient =
      await this.miloClient.getDetailSessionJeune(
        idpToken,
        query.idSession,
        jeune.idPartenaire,
        timezoneDeLaStructureDuJeune
      )
    if (isFailure(resultDetailSessionMiloClient)) {
      return resultDetailSessionMiloClient
    }
    const detailSession = resultDetailSessionMiloClient.data

    const configurationSession = await SessionMiloSqlModel.findByPk(
      detailSession.session.id.toString()
    )

    return success(
      mapDetailSessionJeuneDtoToQueryModel(
        detailSession,
        {
          idDossier: jeune.idPartenaire,
          timezone: timezoneDeLaStructureDuJeune
        },
        { autoinscription: configurationSession?.autoinscription ?? false }
      )
    )
  }

  async authorize(
    query: GetDetailSessionJeuneMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
