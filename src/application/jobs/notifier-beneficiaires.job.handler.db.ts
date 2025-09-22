import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
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
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { DateService } from '../../utils/date-service'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'

interface Stats {
  nbBeneficiairesNotifies: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_BENEFICIAIRES_MAXIMUM_DEFAUT = 2000
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
      const pagination =
        job.contenu.batchSize ||
        PAGINATION_NOMBRE_DE_BENEFICIAIRES_MAXIMUM_DEFAUT

      const idsBeneficiairesAvecComptage = await JeuneSqlModel.findAll({
        where: {
          structure: {
            [Op.in]: job.contenu.structures
          },
          pushNotificationToken: {
            [Op.ne]: null
          }
        },
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
              type: job.contenu.type
            }
          }
          await this.notificationRepository.send(notification, beneficiaire.id)
        } catch (e) {
          this.logger.error(e)
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (idsBeneficiairesAvecComptage.length === pagination) {
        this.planificateurRepository.ajouterJob({
          dateExecution: maintenant
            .plus({
              minute:
                job.contenu.minutesEntreLesBatchs ||
                NOMBRE_MINUTES_ENTRE_BATCHS_DEFAUT
            })
            .toJSDate(),
          type: Planificateur.JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            ...job.contenu,
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
}
