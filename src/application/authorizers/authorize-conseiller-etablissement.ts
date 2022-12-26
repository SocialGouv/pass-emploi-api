import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'

@Injectable()
export class ConseillerEtablissementAuthorizer {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository
  ) {}

  async authorize(
    idAgence: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const conseiller = await this.conseillerRepository.get(utilisateur.id)

      if (conseiller?.agence?.id === idAgence) {
        return emptySuccess()
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
