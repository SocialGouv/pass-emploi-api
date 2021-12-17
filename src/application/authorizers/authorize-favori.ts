import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'

@Injectable()
export class FavoriAuthorizer {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository
  ) {}

  async authorize(
    idJeune: string,
    idOffreEmploi: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const favori = await this.offresEmploiRepository.getFavori(
      idJeune,
      idOffreEmploi
    )

    if (
      favori &&
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      return
    }

    throw new Unauthorized('Favori')
  }
}
