import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface CreateActionCommand extends Command {
  idJeune: Jeune.Id
  contenu: string
  idCreateur: Action.IdCreateur
  typeCreateur: Action.TypeCreateur
  statut?: Action.Statut
  commentaire?: string
}

@Injectable()
export class CreateActionCommandHandler extends CommandHandler<
  CreateActionCommand,
  string
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private readonly notificationRepository: Notification.Repository,
    private readonly actionFactory: Action.Factory,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    private evenementService: EvenementService
  ) {
    super('CreateActionCommandHandler')
  }

  async handle(command: CreateActionCommand): Promise<Result<string>> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const result = this.buildAction(command, jeune)
    if (isFailure(result)) return result

    const action = result.data
    await this.actionRepository.save(action)

    if (
      command.typeCreateur !== Action.TypeCreateur.JEUNE &&
      jeune.pushNotificationToken
    ) {
      await this.sendNotifcationNouvelleAction(
        jeune.pushNotificationToken,
        action
      )
    }

    return success(action.id)
  }

  async authorize(
    command: CreateActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.JEUNE) {
      await this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
    } else {
      await this.conseillerAuthorizer.authorize(
        command.idCreateur,
        utilisateur,
        command.idJeune
      )
    }
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.ACTION_CREEE,
      utilisateur
    )
  }

  private buildAction(
    command: CreateActionCommand,
    jeune: Jeune
  ): Result<Action> {
    return this.actionFactory.buildAction(
      {
        idJeune: command.idJeune,
        contenu: command.contenu,
        statut: command.statut,
        commentaire: command.commentaire,
        typeCreateur: command.typeCreateur
      },
      jeune
    )
  }

  private async sendNotifcationNouvelleAction(
    token: string,
    action: Action
  ): Promise<void> {
    const notification = Notification.createNouvelleAction(token, action.id)
    await this.notificationRepository.send(notification)
    this.logger.log('Notification envoyée')
  }
}
