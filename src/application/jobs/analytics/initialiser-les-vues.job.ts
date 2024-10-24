import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes } from 'sequelize'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { DateService } from '../../../utils/date-service'
import { infosTablesAEAnnuelles } from './creer-tables-ae-annuelles'
import { migrate } from './vues/3-0-migrate-schema'
import { chargerLaVueFonctionnalite } from './vues/3-1-vue-fonctionnalites'
import {
  chargerLaVueEngagement,
  chargerLaVueEngagementNational
} from './vues/3-2-vue-engagement'

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

    for (const tableAnnuelle of infosTablesAEAnnuelles) {
      const tableName = `evenement_engagement${tableAnnuelle.suffix}`
      const semaines = await connexion.query<{ semaine: string }>(
        `SELECT distinct(semaine) from ${tableName} WHERE EXTRACT(YEAR FROM semaine) >= ${tableAnnuelle.depuisAnnee} ORDER BY semaine;`,
        { raw: true, type: QueryTypes.SELECT }
      )

      for (const raw of semaines) {
        this.logger.log(
          'Charger la vue fonctionnalité de la semaine ' + raw.semaine
        )
        await chargerLaVueFonctionnalite(connexion, raw.semaine, tableName)
        this.logger.log(
          'Charger la vue engagement de la semaine ' + raw.semaine
        )
        await chargerLaVueEngagement(
          connexion,
          raw.semaine,
          this.logger,
          tableName
        )
        this.logger.log(
          'Charger la vue engagement national de la semaine ' + raw.semaine
        )
        await chargerLaVueEngagementNational(
          connexion,
          raw.semaine,
          this.logger,
          tableName
        )
      }
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
