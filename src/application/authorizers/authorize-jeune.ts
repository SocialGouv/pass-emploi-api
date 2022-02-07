import { Inject, Injectable } from '@nestjs/common'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'

@Injectable()
export class JeuneAuthorizer {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const jeune = await this.jeuneRepository.existe(idJeune)

    if (jeune && utilisateur) {
      if (
        utilisateur.type === Authentification.Type.JEUNE &&
        utilisateur.id === idJeune
      ) {
        return
      }
    }

    throw new Unauthorized('Jeune')
  }
}
