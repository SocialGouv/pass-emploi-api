import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Unauthorized } from '../../domain/erreur'
import { Milo, MiloRepositoryToken } from '../../domain/milo'
import { DossierJeuneMiloQueryModel } from './query-models/milo.query-model'

export interface GetDossierMiloJeuneQuery extends Query {
  idDossier: string
}

@Injectable()
export class GetDossierMiloJeuneQueryHandler extends QueryHandler<
  GetDossierMiloJeuneQuery,
  DossierJeuneMiloQueryModel | undefined
> {
  constructor(
    @Inject(MiloRepositoryToken)
    private miloRepository: Milo.Repository
  ) {
    super()
  }

  async handle(
    query: GetDossierMiloJeuneQuery
  ): Promise<DossierJeuneMiloQueryModel | undefined> {
    return this.miloRepository.getDossier(query.idDossier)
  }
  async authorize(
    _query: GetDossierMiloJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type !== Authentification.Type.CONSEILLER) {
      throw new Unauthorized('DossierMilo')
    }
  }
}
