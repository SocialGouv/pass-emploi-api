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

export interface SendNotificationNouveauMessageCommand extends Command {
  idJeune: string
  idConseiller: string
}

@Injectable()
export class SendNotificationNouveauMessageCommandHandler extends CommandHandler<
  SendNotificationNouveauMessageCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Service,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('SendNotificationNouveauMessageCommandHandler')
  }

  async handle(
    command: SendNotificationNouveauMessageCommand
  ): Promise<Result<void>> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    if (jeune.conseiller?.id !== command.idConseiller) {
      return failure(
        new JeuneNonLieAuConseillerError(command.idConseiller, command.idJeune)
      )
    }

    if (jeune.pushNotificationToken) {
      const notification = Notification.createNouveauMessage(
        jeune.pushNotificationToken
      )
      await this.notificationRepository.envoyer(notification)
      this.logger.log('Notification envoyée')
    }
    return emptySuccess()
  }

  async authorize(
    command: SendNotificationNouveauMessageCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(
      command.idConseiller,
      utilisateur,
      command.idJeune
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
