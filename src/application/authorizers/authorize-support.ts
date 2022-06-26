import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'

@Injectable()
export class SupportAuthorizer {
  async authorize(utilisateur: Authentification.Utilisateur): Promise<Result> {
    if (utilisateur.type !== Authentification.Type.SUPPORT) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }
}
