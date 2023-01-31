import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import { Authentification } from '../../domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { DossierJeuneMiloQueryModel } from './query-models/milo.query-model'
import {
  JeuneMilo,
  MiloJeuneRepositoryToken
} from '../../domain/jeune/jeune.milo'

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
    private miloRepository: JeuneMilo.Repository
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
    if (
      utilisateur.type !== Authentification.Type.CONSEILLER ||
      utilisateur.structure !== Core.Structure.MILO
    ) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
