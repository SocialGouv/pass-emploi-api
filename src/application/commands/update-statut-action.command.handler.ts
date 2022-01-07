import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { Authentification } from '../../domain/authentification'
import { ActionAuthorizer } from '../authorizers/authorize-action'

export interface UpdateStatutActionCommand extends Command {
  idAction: Action.Id
  statut?: Action.Statut
  estTerminee?: boolean
}

@Injectable()
export class UpdateStatutActionCommandHandler extends CommandHandler<
  UpdateStatutActionCommand,
  void
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    private actionAuthorizer: ActionAuthorizer
  ) {
    super()
  }

  async handle(command: UpdateStatutActionCommand): Promise<Result<void>> {
    const action = await this.actionRepository.get(command.idAction)
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    const result: Result = action.updateStatut({
      statut: command.statut,
      estTerminee: command.estTerminee
    })
    if (isFailure(result)) return result

    await this.actionRepository.save(action)
    return emptySuccess()
  }

  async authorize(
    command: UpdateStatutActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.actionAuthorizer.authorize(command.idAction, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
