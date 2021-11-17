import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action'

export interface UpdateStatutActionCommand extends Command {
  idAction: Action.Id
  statut?: Action.Statut
  estTerminee?: boolean
}

@Injectable()
export class UpdateStatutActionCommandHandler {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository
  ) {}

  async execute(command: UpdateStatutActionCommand): Promise<Result> {
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
}
