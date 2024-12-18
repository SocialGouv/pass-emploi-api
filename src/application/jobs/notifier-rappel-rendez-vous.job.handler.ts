import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification/notification'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
import { DateService } from '../../utils/date-service'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'

interface Stat {
  idJeune: string
  notificationEnvoyee: boolean
}

@Injectable()
@ProcessJobType(Planificateur.JobType.RENDEZVOUS)
export class NotifierRappelRendezVousJobHandler extends JobHandler<
  Planificateur.Job<Planificateur.JobRendezVous>
> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.RENDEZVOUS, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobRendezVous>
  ): Promise<SuiviJob> {
    const debut = this.dateService.now()

    const rendezVous = await this.rendezVousRepository.get(
      job.contenu.idRendezVous
    )

    const stats: Stat[] = []

    if (rendezVous) {
      await Promise.all(
        rendezVous.jeunes.map(async jeune => {
          if (!jeune?.configuration?.pushNotificationToken) {
            stats.push({ idJeune: jeune.id, notificationEnvoyee: false })
          } else {
            const notification = Notification.creerNotificationRappelRdv(
              jeune.configuration.pushNotificationToken,
              job.contenu.idRendezVous,
              DateTime.fromJSDate(rendezVous.date),
              this.dateService
            )
            if (notification) {
              await this.notificationRepository.send(notification, jeune.id)
            }
            stats.push({ idJeune: jeune.id, notificationEnvoyee: true })
          }
        })
      )
    }
    return {
      jobType: this.jobType,
      dateExecution: debut,
      resultat: stats,
      succes: true,
      nbErreurs: 0,
      tempsExecution: DateService.calculerTempsExecution(debut)
    }
  }
}
