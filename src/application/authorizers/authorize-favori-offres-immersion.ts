import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'

@Injectable()
export class FavoriOffresImmersionAuthorizer {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository
  ) {}

  async authorize(
    idJeune: string,
    idOffreImmersion: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const favori = await this.offresImmersionRepository.getFavori(
      idJeune,
      idOffreImmersion
    )

    if (
      favori &&
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      return
    }

    throw new Unauthorized('FavoriOffresImmersion')
  }
}
