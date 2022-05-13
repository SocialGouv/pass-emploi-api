import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface SendNotificationsNouveauxMessagesCommand extends Command {
  idsJeunes: string[]
  idConseiller: string
}

@Injectable()
export class SendNotificationsNouveauxMessagesCommandHandler extends CommandHandler<
  SendNotificationsNouveauxMessagesCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('SendNotificationsNouveauxMessagesCommandHandler')
  }

  async handle(
    command: SendNotificationsNouveauxMessagesCommand
  ): Promise<Result> {
    const jeunes = await this.jeuneRepository.getJeunes(command.idsJeunes)

    for (const jeune of jeunes) {
      if (jeune && jeune.conseiller?.id === command.idConseiller) {
        this.envoyerNotification(jeune)
      }
    }

    return emptySuccess()
  }

  private async envoyerNotification(jeune: Jeune): Promise<void> {
    if (jeune.pushNotificationToken) {
      const notification = Notification.createNouveauMessage(
        jeune.pushNotificationToken
      )
      await this.notificationRepository.send(notification)
      this.logger.log(`Notification envoyée pour le jeune ${jeune.id}`)
    }
  }

  async authorize(
    command: SendNotificationsNouveauxMessagesCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(command.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
