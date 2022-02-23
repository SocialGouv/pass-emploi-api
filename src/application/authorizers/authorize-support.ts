import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'

@Injectable()
export class SupportAuthorizer {
  async authorize(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (utilisateur.type !== Authentification.Type.SUPPORT) {
      throw new Unauthorized('Support')
    }
  }
}
