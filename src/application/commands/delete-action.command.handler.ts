import { Inject, Injectable, Logger } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action'

export interface DeleteActionCommand extends Command {
  idAction: string
}

@Injectable()
export class DeleteActionCommandHandler
  implements CommandHandler<DeleteActionCommand, Result>
{
  private logger: Logger

  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository
  ) {
    this.logger = new Logger('DeleteActionCommandHandler')
  }

  async execute(command: DeleteActionCommand): Promise<Result> {
    const action = await this.actionRepository.get(command.idAction)
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }
    await this.actionRepository.delete(command.idAction)
    this.logger.log(`L'action ${command.idAction} a été supprimée`)
    return emptySuccess()
  }
}
