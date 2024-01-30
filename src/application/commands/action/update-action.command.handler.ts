import { Injectable, Inject } from '@nestjs/common'
import { DateTime } from 'luxon'
import { ActionAuthorizer } from 'src/application/authorizers/action-authorizer'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import {
  Result,
  failure,
  isFailure,
  emptySuccess
} from 'src/building-blocks/types/result'
import { Action, ActionRepositoryToken } from 'src/domain/action/action'
import { Authentification } from 'src/domain/authentification'
import { EvenementService, Evenement } from 'src/domain/evenement'

export interface UpdateActionCommand extends Command {
  idAction: Action.Id
  statut?: Action.Statut
  contenu?: string
  description?: string
  dateEcheance?: DateTime
  dateFinReelle?: DateTime
  codeQualification?: Action.Qualification.Code
}

@Injectable()
export class UpdateActionCommandHandler extends CommandHandler<
  UpdateActionCommand,
  void,
  Action
> {
  constructor(
    @Inject(ActionRepositoryToken)
    private readonly actionRepository: Action.Repository,
    private actionFactory: Action.Factory,
    private actionAuthorizer: ActionAuthorizer,
    private evenementService: EvenementService
  ) {
    super('UpdateActionCommandHandler')
  }

  async getAggregate(
    command: UpdateActionCommand
  ): Promise<Action | undefined> {
    return this.actionRepository.get(command.idAction)
  }

  async handle(
    command: UpdateActionCommand,
    _utilisateur?: Authentification.Utilisateur,
    action?: Action
  ): Promise<Result> {
    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    const result = this.actionFactory.updateAction(action, command)
    if (isFailure(result)) return result

    await this.actionRepository.save(result.data)
    return emptySuccess()
  }

  async authorize(
    command: UpdateActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.actionAuthorizer.autoriserPourUneAction(
      command.idAction,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: UpdateActionCommand,
    action?: Action
  ): Promise<void> {
    if (command.statut !== action?.statut) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_STATUT_MODIFIE,
        utilisateur
      )
    }
    if (
      command.contenu !== action?.contenu ||
      command.description !== action?.description ||
      command.codeQualification !== action?.qualification?.code
    ) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_TEXTE_MODIFIE,
        utilisateur
      )
    }
  }
}
