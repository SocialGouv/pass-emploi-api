import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

export interface SendNotificationsNouveauxMessagesExterneCommand
  extends Command {
  idsAuthentificationJeunes: string[]
  idAuthentificationConseiller: string
}

@Injectable()
export class SendNotificationsNouveauxMessagesExterneCommandHandler extends CommandHandler<
  SendNotificationsNouveauxMessagesExterneCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private notificationService: Notification.Service,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('SendNotificationsNouveauxMessagesExterneCommandHandler')
  }

  async handle(
    command: SendNotificationsNouveauxMessagesExterneCommand
  ): Promise<Result> {
    const jeunes =
      await this.jeuneRepository.findAllJeunesByAuthentificationAndConseiller(
        command.idsAuthentificationJeunes,
        command.idAuthentificationConseiller
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

  async authorize(
    command: SendNotificationsNouveauxMessagesExterneCommand
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseillerExterne(
      command.idAuthentificationConseiller
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
