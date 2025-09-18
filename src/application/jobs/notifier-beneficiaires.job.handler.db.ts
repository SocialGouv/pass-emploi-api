import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Notification } from '../../domain/notification/notification'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { DateService } from '../../utils/date-service'

interface Stats {
  nbBeneficiairesNotifies: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_BENEFICIAIRES_MAXIMUM = 2000

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_BENEFICIAIRES)
export class NotifierBeneficiairesJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private notificationService: Notification.Service,
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
        job.contenu.batchSize || PAGINATION_NOMBRE_DE_BENEFICIAIRES_MAXIMUM

      const idsBeneficiairesAvecComptage: Array<{
        id_beneficiaire_a_notifier: string
        push_notification_token: string
      }> = await this.sequelize.query(
        `SELECT jeune.id as id_beneficiaire_a_notifier, jeune.push_notification_token as push_notification_token
        FROM jeune
        WHERE jeune.dispositif IN (:dispositifs)
        AND jeune.push_notification_token IS NOT NULL
        GROUP BY jeune.id
        ORDER BY jeune.id ASC
        LIMIT :maxJeunes
        OFFSET :offset`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            dispositifs: job.contenu.dispositifs,
            maxJeunes: job.contenu.batchSize || pagination,
            offset
          }
        }
      )

      this.logger.log(
        `${idsBeneficiairesAvecComptage.length} ids bénéficiaires à notifier`
      )

      stats.nbBeneficiairesNotifies += idsBeneficiairesAvecComptage.length
      for (const beneficiaire of idsBeneficiairesAvecComptage) {
        this.notificationService.notifierBeneficiaires(
          beneficiaire.id_beneficiaire_a_notifier,
          beneficiaire.push_notification_token,
          job.contenu.titre,
          job.contenu.description
        )
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (idsBeneficiairesAvecComptage.length === pagination) {
        this.planificateurRepository.ajouterJob({
          dateExecution: maintenant
            .plus({ minute: job.contenu.minutesEntreLesBatchs || 1 })
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
