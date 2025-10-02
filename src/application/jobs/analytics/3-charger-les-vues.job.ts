import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { migrate } from './vues/3-0-migrate-schema'
import { chargerLaVueFonctionnalite } from './vues/3-1-vue-fonctionnalites'
import {
  chargerLaVueEngagement,
  chargerLaVueEngagementNational
} from './vues/3-2-vue-engagement'
import { chargerLaVueFonctionnaliteDemarchesIA } from './vues/3-1bis-vue-fonctionnalites-demarches-ia'

@Injectable()
@ProcessJobType(Planificateur.JobType.CHARGER_LES_VUES_ANALYTICS)
export class ChargerLesVuesJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.CHARGER_LES_VUES_ANALYTICS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()
    const semaine = maintenant
      .startOf('week')
      .minus({ week: 1 })
      .toFormat('yyyy-MM-dd')
    const analyticsTableName = 'evenement_engagement'
    const connexion = await createSequelizeForAnalytics()
    this.logger.log('Migrer le schéma des vues analytics')
    await migrate(connexion)
    this.logger.log('Charger la vue fonctionnalité')
    await chargerLaVueFonctionnalite(connexion, semaine, analyticsTableName)
    this.logger.log('Charger la vue fonctionnalité démarches IA')
    await chargerLaVueFonctionnaliteDemarchesIA(
      connexion,
      semaine,
      analyticsTableName
    )
    this.logger.log('Charger la vue engagement')
    await chargerLaVueEngagement(
      connexion,
      semaine,
      this.logger,
      analyticsTableName
    )
    this.logger.log('Charger la vue engagement national')
    await chargerLaVueEngagementNational(
      connexion,
      semaine,
      this.logger,
      analyticsTableName
    )
    await connexion.close()

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: erreur ? false : true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {}
    }
  }
}
