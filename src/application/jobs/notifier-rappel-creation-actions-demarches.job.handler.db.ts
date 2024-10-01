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
@ProcessJobType(
  Planificateur.JobType.NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES
)
export class NotifierRappelCreationActionsDemarchesJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private notificationService: Notification.Service,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(
      Planificateur.JobType.NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES,
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
      let idsJeunesANotifier: Array<{ id_utilisateur: string }> = []

      do {
        idsJeunesANotifier = await this.sequelize.query(
          `SELECT DISTINCT id_utilisateur 
        FROM evenement_engagement_hebdo
        WHERE structure IN (:structuresConcernees)
        AND type_utilisateur = 'JEUNE'
        GROUP BY id_utilisateur
        HAVING SUM(CASE WHEN code IN (:codesAECreationActionsDemarches) THEN 1 ELSE 0 END) = 0
        ORDER BY id_utilisateur ASC
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

        this.logger.log(`${idsJeunesANotifier.length} ids jeunes à notifier`)

        if (idsJeunesANotifier.length) {
          const jeunesANotifier: Array<{
            id: string
            structure: Core.Structure
            token: string
          }> = await this.sequelize.query(
            `SELECT id, structure, push_notification_token as token from jeune where id in (:idsJeunesANotifier) AND push_notification_token IS NOT NULL`,
            {
              type: QueryTypes.SELECT,
              replacements: {
                idsJeunesANotifier: idsJeunesANotifier.map(
                  id => id.id_utilisateur
                )
              }
            }
          )

          this.logger.log(`${jeunesANotifier.length} jeunes notifiables`)
          stats.nbJeunesNotifiables += jeunesANotifier.length
          for (const jeune of jeunesANotifier) {
            this.notificationService.notifierRappelCreationActionDemarche(jeune)
          }
        }
        offset += PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
      } while (
        idsJeunesANotifier.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
      )
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
