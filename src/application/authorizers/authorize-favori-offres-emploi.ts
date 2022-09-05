import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'

@Injectable()
export class FavoriOffresEmploiAuthorizer {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository
  ) {}

  async authorize(
    idJeune: string,
    idOffreEmploi: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
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
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
