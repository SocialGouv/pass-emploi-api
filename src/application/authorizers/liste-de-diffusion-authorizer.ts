import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller } from '../../domain/conseiller/conseiller'
import ListeDeDiffusion = Conseiller.ListeDeDiffusion
import { ListeDeDiffusionRepositoryToken } from '../../domain/conseiller/liste-de-diffusion'

@Injectable()
export class ListeDeDiffusionAuthorizer {
  constructor(
    @Inject(ListeDeDiffusionRepositoryToken)
    private repository: ListeDeDiffusion.Repository
  ) {}

  async autoriserConseillerPourSaListeDeDiffusion(
    idListe: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      const listeDeDiffusion = await this.repository.get(idListe)

      if (listeDeDiffusion?.idConseiller === utilisateur.id) {
        return emptySuccess()
      }
    }
    return failure(new DroitsInsuffisants())
  }
}
