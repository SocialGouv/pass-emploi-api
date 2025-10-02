import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes } from 'sequelize'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { DateService } from '../../../utils/date-service'
import { chargerLesVuesDeLaSemaine } from './3-charger-les-vues.job'
import { infosTablesAEAnnuelles } from './creer-tables-ae-annuelles'
import { migrate } from './vues/3-0-migrate-schema'

@Injectable()
@ProcessJobType(Planificateur.JobType.INITIALISER_LES_VUES_DERNIERE_ANNEE)
export class InitialiserLesVuesSurLaDerniereAnneeJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(
      Planificateur.JobType.INITIALISER_LES_VUES_DERNIERE_ANNEE,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()
    try {
      const connexion = await createSequelizeForAnalytics()
      this.logger.log('Migrer le schéma des vues analytics')
      await migrate(connexion)

      const tableDerniereAnnee = infosTablesAEAnnuelles.reduce((max, curr) =>
        curr.depuisAnnee > max.depuisAnnee ? curr : max
      )
      const tableName = `evenement_engagement${tableDerniereAnnee.suffix}`
      // Les tables annuelles commencent au 1er novembre de l'année précédente (pour des besoins d'analytics)
      const semaines = await connexion.query<{ semaine: string }>(
        `SELECT distinct(semaine) from ${tableName} WHERE EXTRACT(YEAR FROM semaine) >= ${tableDerniereAnnee.depuisAnnee} ORDER BY semaine;`,
        { raw: true, type: QueryTypes.SELECT }
      )

      for (const raw of semaines) {
        await chargerLesVuesDeLaSemaine(
          connexion,
          raw.semaine,
          tableName,
          this.logger
        )
      }

      await connexion.close()
    } catch (e) {
      erreur = e
      this.logger.error(e)
    }

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
