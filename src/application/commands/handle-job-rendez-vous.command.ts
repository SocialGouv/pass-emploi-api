import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Result, success } from 'src/building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { Planificateur } from '../../domain/planificateur'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { DateService } from '../../utils/date-service'

export interface HandleJobRendezVousCommand extends Command {
  job: Planificateur.Job<Planificateur.JobRendezVous>
}

export interface HandleJobRendezVousCommandResult {
  notificationEnvoyee: boolean
}

@Injectable()
export class HandleJobRendezVousCommandHandler extends CommandHandler<
  HandleJobRendezVousCommand,
  HandleJobRendezVousCommandResult
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private dateService: DateService
  ) {
    super('HandleJobRendezVousCommandHandler')
  }

  async handle(
    command: HandleJobRendezVousCommand
  ): Promise<Result<HandleJobRendezVousCommandResult>> {
    const rendezVous = await this.rendezVousRepository.get(
      command.job.contenu.idRendezVous
    )

    if (!rendezVous?.jeune.pushNotificationToken) {
      return success({ notificationEnvoyee: false })
    }

    const notification = Notification.createRappelRdv(
      rendezVous.jeune.pushNotificationToken,
      command.job.contenu.idRendezVous,
      DateTime.fromJSDate(rendezVous.date),
      this.dateService
    )
    await this.notificationRepository.send(notification)
    return success({ notificationEnvoyee: true })
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: HandleJobRendezVousCommand
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
