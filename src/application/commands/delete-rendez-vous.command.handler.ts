import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'

export interface DeleteRendezVousCommand extends Command {
  idRendezVous: string
}

@Injectable()
export class DeleteRendezVousCommandHandler
  implements CommandHandler<DeleteRendezVousCommand, Result>
{
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository
  ) {}

  async execute(command: DeleteRendezVousCommand): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(command.idRendezVous)
    if (!rendezVous) {
      return failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
    }
    await this.rendezVousRepository.delete(command.idRendezVous)
    if (rendezVous.jeune.pushNotificationToken) {
      const notification = Notification.createRdvSupprime(
        rendezVous.jeune.pushNotificationToken,
        rendezVous.date
      )
      await this.notificationRepository.send(notification)
    }
    return emptySuccess()
  }
}
