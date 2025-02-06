import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estPoleEmploi } from '../../domain/core'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export interface GetTokenPoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
}

@Injectable()
export class GetTokenPoleEmploiQueryHandler extends QueryHandler<
  GetTokenPoleEmploiQuery,
  Result<string>
> {
  constructor(
    private oidcClient: OidcClient,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetTokenPoleEmploiQueryHandler')
  }
  async authorize(
    query: GetTokenPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploi(utilisateur.structure)
    )
  }

  async handle(
    query: GetTokenPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<string>> {
    const token = await this.oidcClient.exchangeTokenJeune(
      query.accessToken,
      utilisateur.structure
    )
    return success(token)
  }

  async monitor(): Promise<void> {
    return
  }
}
