import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { emptySuccess, Result, success } from 'src/building-blocks/types/result'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  Notification,
  NotificationRepositoryToken
} from '../../../domain/notification'
import { Planificateur } from '../../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous'
import { DateService } from '../../../utils/date-service'

export interface HandleJobRappelRendezVousCommand extends Command {
  job: Planificateur.Job<Planificateur.JobRendezVous>
}

export interface HandleJobRappelRendezVousCommandResult {
  idJeune: string
  notificationEnvoyee: boolean
}

@Injectable()
export class HandleJobRappelRendezVousCommandHandler extends CommandHandler<
  HandleJobRappelRendezVousCommand,
  HandleJobRappelRendezVousCommandResult[]
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private dateService: DateService
  ) {
    super('HandleJobRappelRendezVousCommandHandler')
  }

  async handle(
    command: HandleJobRappelRendezVousCommand
  ): Promise<Result<HandleJobRappelRendezVousCommandResult[]>> {
    const rendezVous = await this.rendezVousRepository.get(
      command.job.contenu.idRendezVous
    )

    const stats: HandleJobRappelRendezVousCommandResult[] = []

    if (rendezVous) {
      await Promise.all(
        rendezVous.jeunes.map(async jeune => {
          if (!jeune.pushNotificationToken) {
            stats.push({ idJeune: jeune.id, notificationEnvoyee: false })
          } else {
            const notification = Notification.creerNotificationRappelRdv(
              jeune.pushNotificationToken,
              command.job.contenu.idRendezVous,
              DateTime.fromJSDate(rendezVous.date),
              this.dateService
            )
            if (notification) {
              await this.notificationRepository.send(notification)
            }
            stats.push({ idJeune: jeune.id, notificationEnvoyee: true })
          }
        })
      )
    }

    return success(stats)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
