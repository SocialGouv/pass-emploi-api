import { Inject, Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { structuresCampagnes } from '../../domain/core'
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
import { ReponseCampagneSqlModel } from '../../infrastructure/sequelize/models/reponse-campagne.sql-model'
import { DateService } from '../../utils/date-service'
import { DateTime } from 'luxon'
import { buildError } from '../../utils/logger.module'

interface Stats {
  nbNotifsEnvoyees: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 17000

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_CAMPAGNE)
export class NotifierCampagneJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.NOTIFIER_CAMPAGNE, suiviJobService)
  }

  async handle(
    job: Planificateur.Job<{
      offset: number
      idCampagne: string
      nbNotifsEnvoyees: number
    }>
  ): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbNotifsEnvoyees: job.contenu.nbNotifsEnvoyees,
      estLaDerniereExecution: false
    }
    const maintenant = this.dateService.now()

    try {
      const offset = job.contenu.offset

      const idsJeunesQuiOntReponduALaCampagne = (
        await ReponseCampagneSqlModel.findAll({
          where: { idCampagne: job.contenu.idCampagne },
          attributes: ['idJeune']
        })
      ).map(campagneSql => campagneSql.idJeune)

      const idsJeunesANotifier = await JeuneSqlModel.findAll({
        where: {
          structure: {
            [Op.in]: structuresCampagnes
          },
          pushNotificationToken: {
            [Op.ne]: null
          },
          id: {
            [Op.notIn]: idsJeunesQuiOntReponduALaCampagne
          }
        },
        attributes: ['id', 'pushNotificationToken'],
        offset,
        limit: PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
        order: [['id', 'ASC']]
      })

      this.logger.log(`${idsJeunesANotifier.length} ids jeunes à notifier`)

      for (const jeune of idsJeunesANotifier) {
        try {
          const notification: Notification.Message = {
            token: jeune.pushNotificationToken!,
            notification: {
              title: 'Votre avis compte ! 🙏',
              body: 'Aidez-nous à améliorer l’application en partageant votre avis. Cela ne prend qu’une minute !'
            },
            data: {
              type: 'CAMPAGNE'
            }
          }
          await this.notificationRepository.send(notification, jeune.id)
        } catch (e) {
          this.logger.error(
            buildError(`Échec envoi notif pour le jeune ${jeune.id}`, e)
          )
        }
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      stats.nbNotifsEnvoyees += idsJeunesANotifier.length
      if (idsJeunesANotifier.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM) {
        this.planificateurRepository.creerJob({
          dateExecution: DateTime.now().plus({ seconds: 15 }).toJSDate(),
          type: Planificateur.JobType.NOTIFIER_CAMPAGNE,
          contenu: {
            offset: offset + PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
            idCampagne: job.contenu.idCampagne,
            nbNotifsEnvoyees: stats.nbNotifsEnvoyees
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
