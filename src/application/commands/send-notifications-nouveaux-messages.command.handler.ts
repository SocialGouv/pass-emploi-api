import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
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
    for (const idJeune of command.idsJeunes) {
      const jeune = await this.jeuneRepository.get(idJeune)

      if (!jeune) {
        return failure(new NonTrouveError('Jeune', idJeune))
      }

      if (jeune.conseiller.id !== command.idConseiller) {
        return failure(
          new JeuneNonLieAuConseillerError(command.idConseiller, idJeune)
        )
      }

      if (jeune.pushNotificationToken) {
        const notification = Notification.createNouveauMessage(
          jeune.pushNotificationToken
        )
        await this.notificationRepository.send(notification)
        this.logger.log('Notification envoyée')
      }
    }
    return emptySuccess()
  }

  async authorize(
    command: SendNotificationsNouveauxMessagesCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    for (const idJeune of command.idsJeunes) {
      await this.conseillerAuthorizer.authorize(
        command.idConseiller,
        utilisateur,
        idJeune
      )
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
