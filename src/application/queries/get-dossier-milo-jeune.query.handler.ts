import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estMilo } from '../../domain/core'
import {
  JeuneMilo,
  MiloJeuneRepositoryToken
} from '../../domain/milo/jeune.milo'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { DossierJeuneMiloQueryModel } from './query-models/milo.query-model'

export interface GetDossierMiloJeuneQuery extends Query {
  idDossier: string
}

@Injectable()
export class GetDossierMiloJeuneQueryHandler extends QueryHandler<
  GetDossierMiloJeuneQuery,
  Result<DossierJeuneMiloQueryModel>
> {
  constructor(
    @Inject(MiloJeuneRepositoryToken)
    private miloRepository: JeuneMilo.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetDossierMiloJeuneQueryHandler')
  }

  async handle(
    query: GetDossierMiloJeuneQuery
  ): Promise<Result<DossierJeuneMiloQueryModel>> {
    return this.miloRepository.getDossier(query.idDossier)
  }
  async authorize(
    _query: GetDossierMiloJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserToutConseiller(
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
