import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { Notification } from '../../domain/notification'
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
    private notificationService: Notification.Service,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('SendNotificationsNouveauxMessagesCommandHandler')
  }

  async handle(
    command: SendNotificationsNouveauxMessagesCommand
  ): Promise<Result> {
    const jeunes = await this.jeuneRepository.findAllJeunesByConseiller(
      command.idsJeunes,
      command.idConseiller
    )

    this.notificationService.notifierLesJeunesDuNouveauMessage(jeunes)

    return emptySuccess()
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
