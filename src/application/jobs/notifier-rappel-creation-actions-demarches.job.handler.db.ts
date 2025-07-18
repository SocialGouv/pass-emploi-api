import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Core } from '../../domain/core'
import { Evenement } from '../../domain/evenement'
import { Notification } from '../../domain/notification/notification'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { DateService } from '../../utils/date-service'
import { Jeune } from '../../domain/jeune/jeune'

interface Stats {
  nbJeunesNotifies: number
  estLaDerniereExecution: boolean
}

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 2000

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
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(
      Planificateur.JobType.NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES,
      suiviJobService
    )
  }

  async handle(
    job?: Planificateur.Job<Planificateur.JobRappelCreationActionsDemarches>
  ): Promise<SuiviJob> {
    let succes = true
    const stats: Stats = {
      nbJeunesNotifies: job?.contenu?.nbJeunesNotifies || 0,
      estLaDerniereExecution: false
    }
    const maintenant = this.dateService.now()

    try {
      const structuresConcernees = [
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI
      ]

      const offset = job?.contenu?.offset || 0

      const idsJeunesANotifier: Array<{
        id: string
        structure: Core.Structure
        token: string
        nb_actions: number
        peut_voir_le_comptage_des_heures: boolean | null
      }> = await this.sequelize.query(
        `SELECT j.id as id,
            j.structure as structure,
            j.push_notification_token AS token,
            j.peut_voir_le_comptage_des_heures as peut_voir_le_comptage_des_heures,
            SUM(CASE WHEN e.code IN (:codesAECreationActionsDemarches) THEN 1 ELSE 0 END) AS nb_actions
          FROM evenement_engagement_hebdo e
          JOIN jeune j ON j.id = e.id_utilisateur
          WHERE e.structure IN (:structuresConcernees)
            AND e.type_utilisateur = 'JEUNE'
            AND j.push_notification_token IS NOT NULL
            AND j.dispositif != :dispositifExclu
          GROUP BY j.id, j.structure, j.push_notification_token
          HAVING SUM(CASE WHEN e.code IN (:codesAECreationActionsDemarches) THEN 1 ELSE 0 END) <= 3
          ORDER BY j.id ASC
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
            dispositifExclu: Jeune.Dispositif.PACEA,
            maxJeunes: PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM,
            offset
          }
        }
      )

      this.logger.log(`${idsJeunesANotifier.length} ids jeunes à notifier`)

      stats.nbJeunesNotifies += idsJeunesANotifier.length
      for (const jeune of idsJeunesANotifier) {
        this.notificationService.notifierRappelCreationActionDemarche(
          jeune.id,
          jeune.structure,
          jeune.token,
          jeune.nb_actions,
          jeune.peut_voir_le_comptage_des_heures ?? undefined
        )
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (idsJeunesANotifier.length === PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM) {
        this.planificateurRepository.ajouterJob({
          dateExecution: maintenant.plus({ minute: 1 }).toJSDate(),
          type: Planificateur.JobType
            .NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES,
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
