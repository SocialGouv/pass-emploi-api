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
  nbPersonnesNotifiees: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 17000

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
      nbPersonnesNotifiees: job?.contenu?.nbPersonnesNotifiees || 0,
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
        attributes: ['id', 'pushNotificationToken'],
        offset,
        limit: PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
        order: [['id', 'ASC']]
      })

      this.logger.log(`${idsJeunesANotifier.length} ids jeunes à notifier`)

      stats.nbPersonnesNotifiees += idsJeunesANotifier.length
      if (idsJeunesANotifier.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM) {
        this.planificateurRepository.creerJob({
          dateExecution: maintenant
            .plus({ days: 1 })
            .set({ hour: 15, minute: 30, second: 0, millisecond: 0 })
            .toJSDate(),
          type: Planificateur.JobType.NOTIFIER_CJE,
          contenu: {
            offset: offset + PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
            nbPersonnesNotifiees: stats.nbPersonnesNotifiees
          }
        })
      } else {
        stats.estLaDerniereExecution = true
      }

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
        await new Promise(resolve => setTimeout(resolve, 250))
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
