import { Inject, Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'

@Injectable()
export class ActionAuthorizer {
  constructor(
    @Inject(ActionRepositoryToken)
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
        Authentification.estJeune(utilisateur.type) &&
        utilisateur.id === conseillerEtJeune.idJeune
      ) {
        return emptySuccess()
      }
      if (
        Authentification.estConseiller(utilisateur.type) &&
        utilisateur.id === conseillerEtJeune.idConseiller
      ) {
        return emptySuccess()
      }
    }

    return failure(new DroitsInsuffisants())
  }
}
