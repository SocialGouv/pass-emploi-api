import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'

export interface SendNotificationsNouveauxMessagesExternesCommand
  extends Command {
  idsAuthentificationJeunes: string[]
}

@Injectable()
export class SendNotificationsNouveauxMessagesExternesCommandHandler extends CommandHandler<
  SendNotificationsNouveauxMessagesExternesCommand,
  void
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private notificationService: Notification.Service
  ) {
    super('SendNotificationsNouveauxMessagesExternesCommandHandler')
  }

  async handle(
    command: SendNotificationsNouveauxMessagesExternesCommand
  ): Promise<Result> {
    const jeunes =
      await this.jeuneRepository.findAllJeunesByIdsAuthentification(
        command.idsAuthentificationJeunes
      )

    if (jeunes.length < command.idsAuthentificationJeunes.length) {
      const idsAuthentificationJeunesTrouves = jeunes.map(
        ({ idAuthentification }) => idAuthentification
      )
      const idAuthentificationJeunesNonTrouves =
        command.idsAuthentificationJeunes.filter(
          idAuthentification =>
            !idsAuthentificationJeunesTrouves.includes(idAuthentification)
        )

      return failure(
        new NonTrouveError(
          'Jeune',
          'idAuthentification ' + idAuthentificationJeunesNonTrouves.join(', ')
        )
      )
    }

    this.notificationService.notifierLesJeunesDuNouveauMessage(jeunes)

    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
