import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Core } from '../../domain/core'
import { Unauthorized } from '../../domain/erreur'
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
    super()
  }

  async handle(
    query: GetDossierMiloJeuneQuery
  ): Promise<Result<DossierJeuneMiloQueryModel>> {
    return this.miloRepository.getDossier(query.idDossier)
  }
  async authorize(
    _query: GetDossierMiloJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      !(
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.structure === Core.Structure.MILO
      )
    ) {
      throw new Unauthorized('DossierMilo')
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
