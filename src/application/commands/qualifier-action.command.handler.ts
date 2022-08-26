import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import {
  Action,
  ActionMiloRepositoryToken,
  ActionsRepositoryToken
} from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { ActionAuthorizer } from '../authorizers/authorize-action'

export interface QualifierActionCommand extends Command {
  idAction: string
  codeQualification: Action.Qualification.Code
  utilisateur: Authentification.Utilisateur
  dateFinReelle?: Date
}

@Injectable()
export class QualifierActionCommandHandler extends CommandHandler<
  QualifierActionCommand,
  void
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(ActionMiloRepositoryToken)
    private readonly actionMiloRepository: Action.Milo.Repository,
    private readonly actionAuthorizer: ActionAuthorizer
  ) {
    super('QualifierActionCommandHandler')
  }

  async handle(command: QualifierActionCommand): Promise<Result<void>> {
    const action = await this.actionRepository.get(command.idAction)
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    const actionQualifiee = Action.qualifier(
      action,
      command.codeQualification,
      command.dateFinReelle
    )

    if (isFailure(actionQualifiee)) {
      return actionQualifiee
    }

    if (
      actionQualifiee.data.qualification.code !==
      Action.Qualification.Code.NON_SNP
    ) {
      const snpCree = await this.actionMiloRepository.save(
        actionQualifiee.data,
        command.utilisateur
      )
      if (isFailure(snpCree)) {
        return snpCree
      }
    }
    await this.actionRepository.save(actionQualifiee.data)

    return emptySuccess()
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
