import { Inject, Injectable } from '@nestjs/common'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'

@Injectable()
export class ConseillerForJeuneAuthorizer {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const jeune = await this.jeuneRepository.get(idJeune)

    if (jeune && utilisateur) {
      if (
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.id === jeune.conseiller.id
      ) {
        return
      }
    }

    throw new Unauthorized('ConseillerForJeune')
  }
}
