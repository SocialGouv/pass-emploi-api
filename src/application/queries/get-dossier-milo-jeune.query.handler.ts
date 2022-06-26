import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { Milo, MiloRepositoryToken } from '../../domain/milo'
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
    @Inject(MiloRepositoryToken)
    private miloRepository: Milo.Repository
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
