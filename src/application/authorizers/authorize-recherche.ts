import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Recherche, RecherchesRepositoryToken } from '../../domain/recherche'

@Injectable()
export class RechercheAuthorizer {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository
  ) {}

  async authorize(
    idJeune: string,
    idRecherche: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const rechercheExiste = await this.rechercheRepository.existe(
      idRecherche,
      idJeune
    )

    if (
      rechercheExiste &&
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.id === idJeune
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
