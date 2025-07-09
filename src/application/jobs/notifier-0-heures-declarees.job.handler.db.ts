import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Core } from '../../domain/core'
import { Jeune } from '../../domain/jeune/jeune'
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
  nbJeunesNotifies: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 1000

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_0_HEURES_DECLAREES)
export class Notifier0HeuresDeclareesJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private notificationService: Notification.Service,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.NOTIFIER_0_HEURES_DECLAREES, suiviJobService)
  }

  async handle(
    job?: Planificateur.Job<Planificateur.Job0HeuresDeclarees>
  ): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbJeunesNotifies: job?.contenu?.nbJeunesNotifies || 0,
      estLaDerniereExecution: false
    }
    const maintenant = this.dateService.now()

    try {
      const offset = job?.contenu?.offset || 0

      const idsJeunesAvecComptage: Array<{
        id_jeune_a_notifier: string
        push_notification_token: string
      }> = await this.sequelize.query(
        `SELECT jeune.id as id_jeune_a_notifier, jeune.push_notification_token as push_notification_token
        FROM jeune
        LEFT JOIN action ON action.id_jeune = jeune.id AND action.date_creation >= :debutSemaine
        WHERE jeune.structure = :structure
        AND jeune.dispositif = :dispositif
        AND jeune.push_notification_token IS NOT NULL
        AND jeune.date_derniere_actualisation_token > NOW() - INTERVAL '1 day'
        AND jeune.peut_voir_le_comptage_des_heures = true
        GROUP BY jeune.id
        HAVING COUNT(action.id) = 0
        ORDER BY jeune.id ASC
        LIMIT :maxJeunes
        OFFSET :offset`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            structure: Core.Structure.MILO,
            dispositif: Jeune.Dispositif.CEJ,
            debutSemaine: maintenant.startOf('week').toJSDate(),
            maxJeunes: PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
            offset
          }
        }
      )

      this.logger.log(`${idsJeunesAvecComptage.length} ids jeunes à notifier`)

      stats.nbJeunesNotifies += idsJeunesAvecComptage.length
      for (const jeune of idsJeunesAvecComptage) {
        this.notificationService.notifier0Heures(
          jeune.id_jeune_a_notifier,
          jeune.push_notification_token
        )
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (
        idsJeunesAvecComptage.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
      ) {
        this.planificateurRepository.ajouterJob({
          dateExecution: maintenant.plus({ minute: 1 }).toJSDate(),
          type: Planificateur.JobType.NOTIFIER_0_HEURES_DECLAREES,
          contenu: {
            offset: offset + PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
            nbJeunesNotifies: stats.nbJeunesNotifies
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
