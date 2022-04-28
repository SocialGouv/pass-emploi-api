import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import {
  OffreServiceCiviqueRepositoryToken,
  OffreServiceCivique
} from '../../domain/offre-service-civique'

@Injectable()
export class FavoriOffreServiceCiviqueAuthorizer {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private offresServiceCiviqueRepository: OffreServiceCivique.Repository
  ) {}

  async authorize(
    idJeune: string,
    idOffre: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const favori = await this.offresServiceCiviqueRepository.getFavori(
      idJeune,
      idOffre
    )

    if (
      favori &&
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      return
    }

    throw new Unauthorized('Favoris.OffreServiceCivique')
  }
}
