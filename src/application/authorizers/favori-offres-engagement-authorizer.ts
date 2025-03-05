import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { FavorisOffresServiceCiviqueRepositoryToken } from '../../domain/offre/favori/offre-service-civique'
import { Offre } from '../../domain/offre/offre'

@Injectable()
export class FavoriOffreServiceCiviqueAuthorizer {
  constructor(
    @Inject(FavorisOffresServiceCiviqueRepositoryToken)
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
      Authentification.estJeune(utilisateur.type) &&
      utilisateur.id === idJeune
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
