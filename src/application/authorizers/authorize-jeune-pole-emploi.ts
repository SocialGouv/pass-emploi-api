import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'

@Injectable()
export class JeunePoleEmploiAuthorizer {
  async authorize(
    idJeune: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur &&
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.structure === Core.Structure.POLE_EMPLOI &&
      utilisateur.id === idJeune
    ) {
      return emptySuccess()
    }

    return failure(new DroitsInsuffisants())
  }
}
