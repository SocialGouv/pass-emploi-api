import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { ActionAuthorizer } from '../authorizers/authorize-action'

export interface QualifierActionCommand extends Command {
  idAction: string
  dateFinReelle?: Date
  codeQualification: Action.Qualification.Code
}

@Injectable()
export class QualifierActionCommandHandler extends CommandHandler<
  QualifierActionCommand,
  string
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    private readonly actionAuthorizer: ActionAuthorizer
  ) {
    super('QualifierActionCommandHandler')
  }

  async handle(command: QualifierActionCommand): Promise<Result<string>> {
    const action = await this.actionRepository.get(command.idAction)
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    return success(action.id)
  }

  async authorize(
    command: QualifierActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.actionAuthorizer.authorize(command.idAction, utilisateur)
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(): Promise<void> {
    return
  }
}
