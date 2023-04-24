import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { ActionAuthorizer } from '../../authorizers/action-authorizer'

export interface UpdateStatutActionCommand extends Command {
  idAction: Action.Id
  statut: Action.Statut
}

@Injectable()
export class UpdateStatutActionCommandHandler extends CommandHandler<
  UpdateStatutActionCommand,
  void
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    private actionFactory: Action.Factory,
    private actionAuthorizer: ActionAuthorizer,
    private evenementService: EvenementService
  ) {
    super('UpdateStatutActionCommandHandler')
  }

  async handle(command: UpdateStatutActionCommand): Promise<Result<void>> {
    const action = await this.actionRepository.get(command.idAction)
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    const result = this.actionFactory.updateStatut(action, command.statut)
    if (isFailure(result)) return result

    await this.actionRepository.save(result.data)
    return emptySuccess()
  }

  async authorize(
    command: UpdateStatutActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.actionAuthorizer.autoriserPourUneAction(
      command.idAction,
      utilisateur
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.ACTION_STATUT_MODIFIE,
      utilisateur
    )
  }
}
