import { Injectable } from '@nestjs/common'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { estMilo } from 'src/domain/core'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import {
  GetSessionsJeuneMiloQuery,
  GetSessionsJeuneMiloQueryGetter
} from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'

@Injectable()
export class GetSessionsJeuneMiloQueryHandler extends QueryHandler<
  GetSessionsJeuneMiloQuery,
  Result<SessionJeuneMiloQueryModel[]>
> {
  constructor(
    private readonly getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetSessionsJeuneMiloQueryHandler')
  }

  async handle(
    query: GetSessionsJeuneMiloQuery
  ): Promise<Result<SessionJeuneMiloQueryModel[]>> {
    return await this.getSessionsQueryGetter.handle(query)
  }

  async authorize(
    query: GetSessionsJeuneMiloQuery,
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
