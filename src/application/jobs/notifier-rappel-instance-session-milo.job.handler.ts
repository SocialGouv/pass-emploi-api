import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { isSuccess } from '../../building-blocks/types/result'
import {
  JeuneMilo,
  JeuneMiloRepositoryToken
} from '../../domain/milo/jeune.milo'
import { RendezVousMilo } from '../../domain/milo/rendez-vous.milo'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from '../../domain/milo/session.milo'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification/notification'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'

interface Stats {
  idDossier: string
  notificationEnvoyee: boolean
}

@Injectable()
@ProcessJobType(Planificateur.JobType.RAPPEL_SESSION)
export class NotifierRappelInstanceSessionMiloJobHandler extends JobHandler<
  Planificateur.Job<Planificateur.JobRappelSession>
> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(SessionMiloRepositoryToken)
    private sessionMiloRepository: SessionMilo.Repository,
    @Inject(JeuneMiloRepositoryToken)
    private jeuneRepository: JeuneMilo.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.RAPPEL_SESSION, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobRappelSession>
  ): Promise<SuiviJob> {
    const debut = this.dateService.now()
    const stats: Stats = {
      idDossier: job.contenu.idDossier,
      notificationEnvoyee: false
    }
    let nbErreurs = 0

    try {
      const instance = await this.sessionMiloRepository.findInstanceSession(
        job.contenu.idInstance,
        job.contenu.idDossier
      )

      if (instance && instance.statut === SessionMilo.StatutInstance.PRESCRIT) {
        const resultJeune = await this.jeuneRepository.getByIdDossier(
          job.contenu.idDossier
        )
        if (isSuccess(resultJeune)) {
          if (resultJeune.data.configuration?.pushNotificationToken) {
            const dateTimezonee = RendezVousMilo.timezonerDateMilo(
              instance.dateHeureDebut,
              resultJeune.data
            )

            const notification =
              Notification.creerNotificationRappelSessionMilo(
                resultJeune.data.configuration.pushNotificationToken,
                job.contenu.idSession,
                dateTimezonee,
                this.dateService
              )
            if (notification) {
              await this.notificationRepository.send(
                notification,
                resultJeune.data.id
              )
              stats.notificationEnvoyee = true
            }
          }
        }
      }
    } catch (e) {
      this.logger.error(e)
      nbErreurs = 1
    }
    return {
      jobType: this.jobType,
      dateExecution: debut,
      resultat: stats,
      succes: true,
      nbErreurs,
      tempsExecution: DateService.calculerTempsExecution(debut)
    }
  }
}
