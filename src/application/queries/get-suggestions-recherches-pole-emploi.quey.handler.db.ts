import { emptySuccess, Result } from '../../building-blocks/types/result'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Authentification } from '../../domain/authentification'

class GetSuggestionsRecherchesPoleEmploiQuery {
  idJeune: string
}

export class GetSuggestionsRecherchesPoleEmploiQueryHandler extends QueryHandler<
  GetSuggestionsRecherchesPoleEmploiQuery,
  Result<void>
> {
  constructor(private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer) {
    super('GetSuggestionsRecherchesPoleEmploiQueryHandler')
  }
  async authorize(
    query: GetSuggestionsRecherchesPoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async handle(): Promise<Result<void>> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
