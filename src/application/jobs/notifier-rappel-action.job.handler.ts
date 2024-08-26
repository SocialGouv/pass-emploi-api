import { Inject, Injectable } from '@nestjs/common'
import { isSuccess } from '../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../domain/action/action'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../domain/jeune/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification/notification'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'

interface NotifierRappelActionStats {
  idAction?: string
  idJeune?: string
  notificationEnvoyee: boolean
  raison?: string
}

@Injectable()
@ProcessJobType(Planificateur.JobType.RAPPEL_ACTION)
export class NotifierRappelActionJobHandler extends JobHandler<
  Planificateur.Job<Planificateur.JobRappelAction>
> {
  constructor(
    @Inject(ActionRepositoryToken)
    private actionRepository: Action.Repository,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private actionFactory: Action.Factory,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.RAPPEL_ACTION, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<Planificateur.JobRappelAction>
  ): Promise<SuiviJob> {
    const maintenant = this.dateService.now()

    const action = await this.actionRepository.get(job.contenu.idAction)

    const stats: NotifierRappelActionStats = {
      notificationEnvoyee: false
    }

    if (action) {
      stats.idAction = action.id

      const result =
        this.actionFactory.doitEnvoyerUneNotificationDeRappel(action)

      if (isSuccess(result)) {
        const configuration =
          await this.jeuneConfigurationApplicationRepository.get(action.idJeune)
        stats.idJeune = configuration?.idJeune

        if (configuration && configuration.pushNotificationToken) {
          const notification = Notification.creerNotificationRappelAction(
            configuration.pushNotificationToken,
            job.contenu.idAction
          )
          if (notification) {
            await this.notificationRepository.send(notification)
          }
          stats.notificationEnvoyee = true
        }
      } else {
        stats.raison = result.error.message
      }
    }
    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }
}
