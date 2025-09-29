import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
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
import { buildError } from '../../utils/logger.module'
import { TIME_ZONE_EUROPE_PARIS } from '../../config/configuration'

interface Stats {
  nbNotifsEnvoyees: number
  totalBeneficiairesANotifier: number
  estLaDerniereExecution: boolean
  reprogrammmationPourLeLendemain: boolean
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 17000

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_ACTUALISATION)
export class NotifierActualisationJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.NOTIFIER_ACTUALISATION, suiviJobService)
  }

  async handle(
    job?: Planificateur.Job<{
      offset: number
      nbNotifsEnvoyees: number
    }>
  ): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbNotifsEnvoyees: job?.contenu?.nbNotifsEnvoyees || 0,
      totalBeneficiairesANotifier: 0,
      estLaDerniereExecution: false,
      reprogrammmationPourLeLendemain: false
    }
    const debutExecutionJob = this.dateService.now()
    const heure = debutExecutionJob.hour
    const jour = debutExecutionJob.weekday
    const jeudi = 4

    if (jour === jeudi || heure >= 18) {
      return this.reprogrammerPourLeLendemain(debutExecutionJob, stats, job)
    }

    try {
      const offset = job?.contenu?.offset || 0

      const jeunesANotifier = await recupererBeneficiairesANotifier(offset)

      this.logger.log(`${jeunesANotifier.rows.length} ids jeunes à notifier`)

      await this.notifierLesJeunes(jeunesANotifier.rows)

      stats.nbNotifsEnvoyees += jeunesANotifier.rows.length
      stats.totalBeneficiairesANotifier = jeunesANotifier.count
      if (jeunesANotifier.rows.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM) {
        this.planificateurRepository.ajouterJob({
          dateExecution: DateTime.now().plus({ seconds: 15 }).toJSDate(),
          type: Planificateur.JobType.NOTIFIER_ACTUALISATION,
          contenu: {
            offset: offset + PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
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
      dateExecution: debutExecutionJob,
      tempsExecution: DateService.calculerTempsExecution(debutExecutionJob),
      resultat: stats
    }
  }

  private async reprogrammerPourLeLendemain(
    maintenant: DateTime,
    stats: Stats,
    job?: Planificateur.Job<{ offset: number; nbNotifsEnvoyees: number }>
  ): Promise<SuiviJob> {
    const demainA8h = maintenant
      .plus({ days: 1 })
      .setZone(TIME_ZONE_EUROPE_PARIS)
      .set({ hour: 8 })
      .toJSDate()

    await this.planificateurRepository.ajouterJob({
      dateExecution: demainA8h,
      type: Planificateur.JobType.NOTIFIER_ACTUALISATION,
      contenu: job?.contenu
    })

    stats.reprogrammmationPourLeLendemain = true

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }

  private async notifierLesJeunes(jeunes: JeuneSqlModel[]): Promise<void> {
    for (const { id, pushNotificationToken } of jeunes) {
      try {
        const notification: Notification.Message = {
          token: pushNotificationToken!,
          notification: {
            title: 'La période d’actualisation France Travail a commencé',
            body: 'Pensez à vous actualiser avant le 15 du mois'
          },
          data: {
            type: 'ACTUALISATION_PE'
          }
        }
        await this.notificationRepository.send(notification, id)
      } catch (e) {
        this.logger.error(
          buildError(`Échec envoi notif pour le jeune ${id}`, e)
        )
      }
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  }
}

async function recupererBeneficiairesANotifier(
  offset: number
): Promise<{ rows: JeuneSqlModel[]; count: number }> {
  return await JeuneSqlModel.findAndCountAll({
    where: {
      structure: Core.structuresFT,
      pushNotificationToken: {
        [Op.ne]: null
      }
    },
    attributes: ['id', 'pushNotificationToken'],
    offset,
    limit: PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
    order: [['id', 'ASC']]
  })
}
