import { Inject, Injectable, Logger } from '@nestjs/common'
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
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'

export interface SendNotificationNouveauMessageCommand extends Command {
  idJeune: string
  idConseiller: string
}

@Injectable()
export class SendNotificationNouveauMessageCommandHandler
  implements CommandHandler<SendNotificationNouveauMessageCommand, Result>
{
  private logger

  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository
  ) {
    this.logger = new Logger('SendNotificationNouveauMessageCommandHandler')
  }

  async execute(
    command: SendNotificationNouveauMessageCommand
  ): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    if (jeune.conseiller.id !== command.idConseiller) {
      return failure(
        new JeuneNonLieAuConseillerError(command.idConseiller, command.idJeune)
      )
    }

    if (jeune.pushNotificationToken) {
      const notification = Notification.createNouveauMessage(
        jeune.pushNotificationToken
      )
      await this.notificationRepository.send(notification)
      this.logger.log('Notification envoyée')
    }
    return emptySuccess()
  }
}
