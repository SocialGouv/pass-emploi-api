import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { FavorisOffresEmploiRepositoryToken } from '../../domain/offre/favori/offre-emploi'
import { Offre } from '../../domain/offre/offre'

@Injectable()
export class FavoriOffresEmploiAuthorizer {
  constructor(
    @Inject(FavorisOffresEmploiRepositoryToken)
    private offresEmploiRepository: Offre.Favori.Emploi.Repository
  ) {}

  async autoriserLeJeunePourSonOffre(
    idJeune: string,
    idOffreEmploi: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const favori = await this.offresEmploiRepository.get(idJeune, idOffreEmploi)

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
