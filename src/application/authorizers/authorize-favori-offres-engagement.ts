import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import {
  OffreServiceCivique,
  OffreServiceCiviqueRepositoryToken
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
  ): Promise<Result> {
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
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
