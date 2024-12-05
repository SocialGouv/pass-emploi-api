import { Inject, Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Core } from '../../domain/core'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification/notification'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../utils/date-service'

interface Stats {
  nbPersonnesNotifies: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 2000

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_CJE)
export class NotifierCJEJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.NOTIFIER_CJE, suiviJobService)
  }

  async handle(
    job?: Planificateur.Job<Planificateur.JobNotifierParGroupe>
  ): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbPersonnesNotifies: job?.contenu?.nbPersonnesNotifies || 0,
      estLaDerniereExecution: false
    }
    const maintenant = this.dateService.now()

    try {
      const structuresConcernees = [
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI
      ]

      const offset = job?.contenu?.offset || 0

      const idsJeunesANotifier = await JeuneSqlModel.findAll({
        where: {
          structure: {
            [Op.in]: structuresConcernees
          },
          pushNotificationToken: {
            [Op.ne]: null
          }
        },
        attributes: ['id', 'pushNotificationToken']
      })

      this.logger.log(`${idsJeunesANotifier.length} ids jeunes à notifier`)

      stats.nbPersonnesNotifies += idsJeunesANotifier.length
      for (const jeune of idsJeunesANotifier) {
        try {
          const notification: Notification.Message = {
            token: jeune.pushNotificationToken!,
            notification: {
              title: `👋 Retrouvez vos avantages du CEJ`,
              body: `+ de 65 réductions disponibles grâce à la carte "Jeune Engagé"`
            },
            data: {
              type: 'CJE'
            }
          }
          await this.notificationRepository.send(notification)
          this.logger.log(`Notification envoyée pour le jeune ${jeune.id}`)
        } catch (e) {
          this.logger.error(e)
          this.logger.log(`Echec envoi notif pour le jeune ${jeune.id}`)
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (idsJeunesANotifier.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM) {
        const dateExecution =
          maintenant.hour <= 19 && maintenant.hour >= 8
            ? maintenant.plus({ minutes: 30 }).toJSDate()
            : maintenant
                .plus({ days: 1 })
                .set({ hour: 8, minute: 0, second: 0, millisecond: 0 })
                .toJSDate()
        this.planificateurRepository.creerJob({
          dateExecution,
          type: Planificateur.JobType.NOTIFIER_CJE,
          contenu: {
            offset: offset + PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
            nbPersonnesNotifies: stats.nbPersonnesNotifies
          }
        })
      } else {
        stats.estLaDerniereExecution = true
      }
    } catch (e) {
      this.logger.error(e)
      succes = false
    }

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }
}
