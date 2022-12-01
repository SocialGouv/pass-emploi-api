import { Inject, Injectable } from '@nestjs/common'
import {
  Conseiller,
  ConseillersRepositoryToken
} from 'src/domain/conseiller/conseiller'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'

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
