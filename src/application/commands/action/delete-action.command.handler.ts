import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { ActionAuthorizer } from '../../authorizers/action-authorizer'

export interface DeleteActionCommand extends Command {
  idAction: string
}

@Injectable()
export class DeleteActionCommandHandler extends CommandHandler<
  DeleteActionCommand,
  void
> {
  constructor(
    @Inject(ActionRepositoryToken)
    private readonly actionRepository: Action.Repository,
    private actionAuthorizer: ActionAuthorizer,
    private evenementService: EvenementService
  ) {
    super('DeleteActionCommandHandler')
  }

  async handle(command: DeleteActionCommand): Promise<Result<void>> {
    const action = await this.actionRepository.get(command.idAction, {
      avecCommentaires: true
    })
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    if (action.commentaires?.length) {
      return failure(
        new MauvaiseCommandeError(
          'Impossible de supprimer une action avec un commentaire.'
        )
      )
    }

    if (Action.estTerminee(action)) {
      return failure(
        new MauvaiseCommandeError(
          'Impossible de supprimer une action terminée.'
        )
      )
    }

    await this.actionRepository.delete(command.idAction)
    this.logger.log(`L'action ${command.idAction} a été supprimée`)

    return emptySuccess()
  }

  async authorize(
    command: DeleteActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.actionAuthorizer.autoriserPourUneAction(
      command.idAction,
      utilisateur
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.ACTION_SUPPRIMEE,
      utilisateur
    )
  }
}
