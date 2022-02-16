import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
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
  ): Promise<void> {
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
      return
    }

    throw new Unauthorized('Recherche')
  }
}
