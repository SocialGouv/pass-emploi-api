import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { OffresImmersionRepositoryToken } from '../../domain/offre/favori/offre-immersion'
import { Offre } from '../../domain/offre/offre'

@Injectable()
export class FavoriOffresImmersionAuthorizer {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: Offre.Favori.Immersion.Repository
  ) {}

  async authorize(
    idJeune: string,
    idOffreImmersion: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const favori = await this.offresImmersionRepository.get(
      idJeune,
      idOffreImmersion
    )

    if (
      favori &&
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
