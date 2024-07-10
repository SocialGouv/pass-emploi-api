import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { migrate } from './vues/3-0-migrate-schema'
import { chargerLaVueFonctionnalite } from './vues/3-1-vue-fonctionnalites'
import { chargerLaVueEngagement } from './vues/3-2-vue-engagement'
import { QueryTypes } from 'sequelize'
import { DateTime } from 'luxon'

@Injectable()
@ProcessJobType(Planificateur.JobType.INITIALISER_LES_VUES)
export class InitialiserLesVuesJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.INITIALISER_LES_VUES, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()
    const connexion = await createSequelizeForAnalytics()
    this.logger.log('Migrer le schéma des vues analytics')
    await migrate(connexion)

    const semaines = (await connexion.query(
      `SELECT distinct(semaine) from evenement_engagement ORDER BY semaine;`,
      { raw: true, type: QueryTypes.SELECT }
    )) as Array<{ semaine: string }>

    for (const raw of semaines) {
      this.logger.log(
        'Charger la vue fonctionnalité de la semaine ' + raw.semaine
      )
      const tableName = getAnalyticsTableName(raw.semaine)
      await chargerLaVueFonctionnalite(connexion, raw.semaine, tableName)
      this.logger.log('Charger la vue engagement de la semaine ' + raw.semaine)
      await chargerLaVueEngagement(
        connexion,
        raw.semaine,
        this.logger,
        tableName
      )
    }

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

function getAnalyticsTableName(semaine: string): string {
  const annee = DateTime.fromFormat(semaine, 'yyyy-MM-dd').year
  if (annee < 2024) {
    return `evenement_engagement_${annee}`
  } else {
    return 'evenement_engagement'
  }
}
