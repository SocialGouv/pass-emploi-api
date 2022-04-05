import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Core } from 'src/domain/core'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { JeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetJeuneMiloByDossierQuery extends Query {
  idDossier: string
}

@Injectable()
export class GetJeuneMiloByDossierQueryHandler extends QueryHandler<
  GetJeuneMiloByDossierQuery,
  Result<JeuneQueryModel>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetJeuneMiloByDossierQueryHandler')
  }

  async handle(
    query: GetJeuneMiloByDossierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<JeuneQueryModel>> {
    const jeune = await this.jeunesRepository.getJeuneQueryModelByIdDossier(
      query.idDossier,
      utilisateur.id
    )
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idDossier))
    }
    return success(jeune)
  }

  async authorize(
    _query: GetJeuneMiloByDossierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    return this.conseillerAuthorizer.authorizeConseiller(
      utilisateur,
      Core.Structure.MILO
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
