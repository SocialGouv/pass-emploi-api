import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'
import { Core } from '../../domain/core'

@Injectable()
export class JeunePoleEmploiAuthorizer {
  async authorize(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.structure === Core.Structure.POLE_EMPLOI &&
      utilisateur.id === idJeune
    ) {
      return
    }

    throw new Unauthorized('JeunePoleEmploi')
  }
}
