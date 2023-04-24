import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { OffreServiceCiviqueRepositoryToken } from '../../domain/offre/favori/offre-service-civique'
import { Offre } from '../../domain/offre/offre'

@Injectable()
export class FavoriOffreServiceCiviqueAuthorizer {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private offresServiceCiviqueRepository: Offre.Favori.ServiceCivique.Repository
  ) {}

  async autoriserLeJeunePourSonOffre(
    idJeune: string,
    idOffre: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const favori = await this.offresServiceCiviqueRepository.get(
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
