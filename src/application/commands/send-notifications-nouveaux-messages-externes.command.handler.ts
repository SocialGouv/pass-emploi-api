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

export interface SendNotificationsNouveauxMessagesExternesCommand
  extends Command {
  idsAuthentificationJeunes: string[]
  idAuthentificationConseiller: string
}

@Injectable()
export class SendNotificationsNouveauxMessagesExternesCommandHandler extends CommandHandler<
  SendNotificationsNouveauxMessagesExternesCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private notificationService: Notification.Service,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('SendNotificationsNouveauxMessagesExternesCommandHandler')
  }

  async handle(
    command: SendNotificationsNouveauxMessagesExternesCommand
  ): Promise<Result> {
    const jeunes =
      await this.jeuneRepository.findAllJeunesByIdsAuthentificationAndConseiller(
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
    command: SendNotificationsNouveauxMessagesExternesCommand
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseillerExterne(
      command.idAuthentificationConseiller
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
