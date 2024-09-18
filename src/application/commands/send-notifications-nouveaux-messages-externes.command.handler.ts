import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  Result,
  emptySuccess,
  failure,
  success
} from '../../building-blocks/types/result'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'
import { Core } from '../../domain/core'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { RateLimiterService } from '../../utils/rate-limiter.service'

export interface SendNotificationsNouveauxMessagesExternesCommand
  extends Command {
  idsAuthentificationJeunes: string[]
}

export interface SendNotificationsNouveauxMessagesExternesResult {
  idsNonTrouves: string[]
}

@Injectable()
export class SendNotificationsNouveauxMessagesExternesCommandHandler extends CommandHandler<
  SendNotificationsNouveauxMessagesExternesCommand,
  SendNotificationsNouveauxMessagesExternesResult
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private notificationService: Notification.Service,
    private rateLimiterService: RateLimiterService
  ) {
    super('SendNotificationsNouveauxMessagesExternesCommandHandler')
  }

  async handle(
    command: SendNotificationsNouveauxMessagesExternesCommand
  ): Promise<Result<SendNotificationsNouveauxMessagesExternesResult>> {
    this.rateLimiterService.notifsCVMRateLimiter.attendreLaProchaineDisponibilite()

    const jeunes =
      await this.jeuneRepository.findAllJeunesByIdsAuthentificationAndStructures(
        command.idsAuthentificationJeunes,
        Core.structuresBeneficiaireFranceTravail
      )

    if (!jeunes.length) {
      return failure(
        new NonTrouveError(
          'Jeune',
          'idAuthentification ' + command.idsAuthentificationJeunes.join(', ')
        )
      )
    }

    const retour: SendNotificationsNouveauxMessagesExternesResult = {
      idsNonTrouves: []
    }
    if (jeunes.length < command.idsAuthentificationJeunes.length) {
      const idsAuthentificationJeunesTrouves = jeunes.map(
        ({ idAuthentification }) => idAuthentification
      )

      const idsAuthentificationJeunesNonTrouves =
        command.idsAuthentificationJeunes.filter(
          idAuthentification =>
            !idsAuthentificationJeunesTrouves.includes(idAuthentification)
        )

      this.logger.warn(
        'Ids non trouvés : ' + idsAuthentificationJeunesNonTrouves.join(', ')
      )
      retour.idsNonTrouves = idsAuthentificationJeunesNonTrouves
    }

    this.notificationService.notifierLesJeunesDuNouveauMessage(jeunes)

    return success(retour)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
