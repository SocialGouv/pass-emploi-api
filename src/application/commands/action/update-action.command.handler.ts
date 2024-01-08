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
  codeQualification?: Action.Qualification.Code
}

@Injectable()
export class UpdateActionCommandHandler extends CommandHandler<
  UpdateActionCommand,
  void
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

  async handle(command: UpdateActionCommand): Promise<Result<void>> {
    const action = await this.actionRepository.get(command.idAction)
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
    command: UpdateActionCommand
  ): Promise<void> {
    if (command.statut) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_STATUT_MODIFIE,
        utilisateur
      )
    }
    if (command.contenu || command.description || command.codeQualification) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_TEXTE_MODIFIE,
        utilisateur
      )
    }
  }
}
