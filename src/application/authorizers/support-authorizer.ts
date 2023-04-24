import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'

@Injectable()
export class SupportAuthorizer {
  async autoriserSupport(
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type !== Authentification.Type.SUPPORT) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }
}
