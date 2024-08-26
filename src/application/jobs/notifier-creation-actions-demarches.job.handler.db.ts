import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Core } from '../../domain/core'
import { Evenement } from '../../domain/evenement'
import { Notification } from '../../domain/notification/notification'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { DateService } from '../../utils/date-service'

interface Stats {
  nbJeunesNotifiables: number
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 1000

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_CREATION_ACTIONS_DEMARCHES)
export class NotifierCreationActionsDemarchesJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private notificationService: Notification.Service,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(
      Planificateur.JobType.NOTIFIER_CREATION_ACTIONS_DEMARCHES,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbJeunesNotifiables: 0
    }
    const maintenant = this.dateService.now()

    try {
      const structuresConcernees = [
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI
      ]

      let offset = 0
      let jeunesANotifier: Array<{
        id: string
        structure: Core.Structure
        token: string
      }> = []

      do {
        jeunesANotifier = await this.sequelize.query(
          `SELECT DISTINCT jeune.id as id, jeune.structure as structure, jeune.push_notification_token as token 
        FROM jeune, evenement_engagement_hebdo
        WHERE jeune.structure IN (:structuresConcernees)
        AND push_notification_token IS NOT NULL
        AND jeune.id = evenement_engagement_hebdo.id_utilisateur
        GROUP BY jeune.id, evenement_engagement_hebdo.id_utilisateur
        HAVING COUNT(*) > 0
        AND SUM(CASE WHEN evenement_engagement_hebdo.code IN (:codesAECreationActionsDemarches) THEN 1 ELSE 0 END) = 0
        ORDER BY jeune.id ASC
        LIMIT :maxJeunes
        OFFSET :offset`,
          {
            type: QueryTypes.SELECT,
            replacements: {
              structuresConcernees,
              codesAECreationActionsDemarches: [
                Evenement.Code.ACTION_CREEE,
                Evenement.Code.ACTION_CREEE_HORS_REFERENTIEL,
                Evenement.Code.ACTION_CREEE_REFERENTIEL,
                Evenement.Code.ACTION_CREEE_SUGGESTION,
                Evenement.Code.ACTION_CREEE_HORS_SUGGESTION,
                Evenement.Code.ACTION_DUPLIQUEE,
                Evenement.Code.ACTION_DUPLIQUEE_HORS_REFERENTIEL,
                Evenement.Code.ACTION_DUPLIQUEE_REFERENTIEL
              ],
              maxJeunes: PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
              offset
            }
          }
        )

        stats.nbJeunesNotifiables += jeunesANotifier.length
        for (const jeune of jeunesANotifier) {
          this.notificationService.notifierCreationActionDemarche(jeune)
        }
        offset += PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
      } while (jeunesANotifier.length)
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
