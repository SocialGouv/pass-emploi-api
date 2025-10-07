import { Inject, Injectable } from '@nestjs/common'
import { Op, WhereOptions } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
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
import { DateService } from '../../utils/date-service'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { TIME_ZONE_EUROPE_PARIS } from '../../config/configuration'
import { DateTime, WeekdayNumbers } from 'luxon'

interface Stats {
  nbBeneficiairesNotifies: number
  estLaDerniereExecution: boolean
}

const NOMBRE_MINUTES_ENTRE_BATCHS_DEFAUT = 5

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_BENEFICIAIRES)
export class NotifierBeneficiairesJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.NOTIFIER_BENEFICIAIRES, suiviJobService)
  }

  async handle(
    job?: Planificateur.Job<Planificateur.JobNotifierBeneficiaires>
  ): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbBeneficiairesNotifies: job?.contenu?.nbBeneficiairesNotifies || 0,
      estLaDerniereExecution: false
    }
    const maintenant = this.dateService.now()

    if (!job)
      return {
        jobType: this.jobType,
        nbErreurs: 0,
        succes: false,
        dateExecution: maintenant,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        resultat: stats
      }

    try {
      const offset = job.contenu?.offset || 0

      let pagination = job.contenu.batchSize
      const where: WhereOptions = {
        pushNotificationToken: {
          [Op.ne]: null
        }
      }
      if (job.contenu.structures && job.contenu.structures.length > 0) {
        where.structure = { [Op.in]: job.contenu.structures }
      }
      if (!pagination) {
        const nbBeneficiairesTotal = await JeuneSqlModel.count({
          where
        })
        const unQuartDeLaPopulationTotaleEtMinimum1 = Math.max(
          Math.trunc(0.25 * nbBeneficiairesTotal),
          1
        )
        pagination =
          job.contenu.batchSize || unQuartDeLaPopulationTotaleEtMinimum1
      }

      const idsBeneficiairesAvecComptage = await JeuneSqlModel.findAll({
        where,
        attributes: ['id', 'pushNotificationToken'],
        offset,
        limit: pagination,
        order: [['id', 'ASC']]
      })

      stats.nbBeneficiairesNotifies += idsBeneficiairesAvecComptage.length
      for (const beneficiaire of idsBeneficiairesAvecComptage) {
        try {
          const notification = {
            token: beneficiaire.pushNotificationToken!,
            notification: {
              title: job.contenu.titre,
              body: job.contenu.description
            },
            data: {
              type: job.contenu.typeNotification
            }
          }
          await this.notificationRepository.send(
            notification,
            beneficiaire.id,
            job.contenu.push
          )
        } catch (e) {
          this.logger.error(e)
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const minutesEntreLesBatchs =
        job.contenu.minutesEntreLesBatchs || NOMBRE_MINUTES_ENTRE_BATCHS_DEFAUT
      // todo: condition d'arret à revoir ?
      if (idsBeneficiairesAvecComptage.length === pagination) {
        let dateExecution = maintenant
          .plus({
            minute: minutesEntreLesBatchs
          })
          .setZone(TIME_ZONE_EUROPE_PARIS)

        dateExecution = this.reporterDateEnJourOuvreLaJournee(dateExecution)

        this.planificateurRepository.ajouterJob({
          dateExecution: dateExecution.toJSDate(),
          type: Planificateur.JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            ...job.contenu,
            batchSize: pagination,
            minutesEntreLesBatchs: minutesEntreLesBatchs,
            offset: offset + pagination,
            nbBeneficiairesNotifies: stats.nbBeneficiairesNotifies
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

  private reporterDateEnJourOuvreLaJournee(date: DateTime): DateTime {
    const lundi = 1
    const samedi = 6

    const jour = date.localWeekday
    const prochainJourOuvre = (
      jour >= samedi ? lundi : jour + 1
    ) as WeekdayNumbers

    const huitHeures = { hour: 8, minute: 0, second: 0 }

    const prochainJourOuvre8h00 = {
      localWeekday: prochainJourOuvre,
      ...huitHeures
    }

    let newDate = date
    if (newDate.hour >= 17) {
      newDate = date.set(prochainJourOuvre8h00)
    }
    if (newDate.hour < 8) newDate = newDate.set(huitHeures)
    if (newDate.localWeekday >= samedi) {
      newDate = newDate.set(prochainJourOuvre8h00)
    }

    return newDate
  }
}
