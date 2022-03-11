import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import {
  EngagementRepositoryToken,
  OffreEngagement
} from '../../domain/offre-engagement'

@Injectable()
export class FavoriOffreEngagementAuthorizer {
  constructor(
    @Inject(EngagementRepositoryToken)
    private offresEngagementRepository: OffreEngagement.Repository
  ) {}

  async authorize(
    idJeune: string,
    idOffre: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const favori = await this.offresEngagementRepository.getFavori(
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

    throw new Unauthorized('FavoriOffreEngagement')
  }
}
