import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'

@Injectable()
export class ActionAuthorizer {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository
  ) {}

  async autoriserPourUneAction(
    idAction: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const conseillerEtJeune = await this.actionRepository.getConseillerEtJeune(
      idAction
    )

    if (utilisateur && conseillerEtJeune) {
      if (
        utilisateur.type === Authentification.Type.JEUNE &&
        utilisateur.id === conseillerEtJeune.idJeune
      ) {
        return emptySuccess()
      }
      if (
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.id === conseillerEtJeune.idConseiller
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}