import { Inject, Injectable } from '@nestjs/common'
import { Action, ActionsRepositoryToken } from 'src/domain/action'
import { Authentification } from 'src/domain/authentification'
import { Unauthorized } from 'src/domain/erreur'

@Injectable()
export class ActionAuthorizer {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository
  ) {}

  async authorize(
    idAction: string,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const conseillerEtJeune = await this.actionRepository.getConseillerEtJeune(
      idAction
    )

    if (utilisateur && conseillerEtJeune) {
      if (
        utilisateur.type === Authentification.Type.JEUNE &&
        utilisateur.id === conseillerEtJeune.idJeune
      ) {
        return
      }
      if (
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.id === conseillerEtJeune.idConseiller
      ) {
        return
      }
    }

    throw new Unauthorized('Action')
  }
}
