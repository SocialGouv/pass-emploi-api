import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Recherche,
  RecherchesRepositoryToken
} from '../../domain/offre/recherche/recherche'

@Injectable()
export class RechercheAuthorizer {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository
  ) {}

  async authorize(
    idJeune: string,
    idRecherche: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const rechercheExiste = await this.rechercheRepository.existe(
      idRecherche,
      idJeune
    )

    if (
      rechercheExiste &&
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
