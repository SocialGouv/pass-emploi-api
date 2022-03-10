import { Inject, Injectable } from '@nestjs/common'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import { Core } from '../../domain/core'

@Injectable()
export class JeunePoleEmploiAuthorizer {
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
        utilisateur.structure === Core.Structure.POLE_EMPLOI &&
        utilisateur.id === idJeune
      ) {
        return
      }
    }

    throw new Unauthorized('JeunePoleEmploi')
  }
}
