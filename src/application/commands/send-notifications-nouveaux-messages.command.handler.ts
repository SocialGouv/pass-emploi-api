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
  ): Promise<Result<void>> {
    const jeunes = await this.jeuneRepository.getJeunes(command.idsJeunes)
    await Promise.all(jeunes.map(this.envoyerNotifications.bind(this)))
    return emptySuccess()
  }

  private async envoyerNotifications(jeune: Jeune): Promise<void> {
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
    const idsJeunes = command.idsJeunes
    await Promise.all(
      idsJeunes.map(idJeune =>
        this.conseillerAuthorizer.authorize(
          command.idConseiller,
          utilisateur,
          idJeune
        )
      )
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
