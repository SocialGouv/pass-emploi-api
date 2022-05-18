import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { Unauthorized } from '../../domain/erreur'

@Injectable()
export class AuthorizeConseillerForJeunes {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async authorize(
    idsJeunes: string[],
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type !== Authentification.Type.CONSEILLER) {
      throw new Unauthorized('ConseillerForJeunes')
    }

    const jeunes = await this.jeuneRepository.findAllJeunesByConseiller(
      idsJeunes,
      utilisateur.id
    )

    if (jeunes.length !== idsJeunes.length) {
      throw new Unauthorized('ConseillerForJeunes')
    }
  }
}
