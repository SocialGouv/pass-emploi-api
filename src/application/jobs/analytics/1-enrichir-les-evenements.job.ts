import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { Sequelize } from 'sequelize-typescript'

@Injectable()
@ProcessJobType(Planificateur.JobType.ENRICHIR_EVENEMENTS_ANALYTICS)
export class EnrichirEvenementsJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.ENRICHIR_EVENEMENTS_ANALYTICS, suiviJobService)
  }

  async handle(_job: Planificateur.Job): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()
    const connexion = await createSequelizeForAnalytics()
    await this.mettreAJourLeSchema(connexion)
    await this.dropperLesIndex(connexion)
    await Promise.all([
      this.ajouterLesAgencesConseiller(connexion),
      this.ajouterLesAgencesJeune(connexion),
      this.determinerLaSemaine(connexion)
    ])
    await this.indexerLesColonnes(connexion)

    const jobRechargerLesVues: Planificateur.Job<void> = {
      dateExecution: this.dateService.nowJs(),
      type: Planificateur.JobType.CHARGER_LES_VUES_ANALYTICS,
      contenu: undefined
    }
    await this.planificateurRepository.creerJob(jobRechargerLesVues)

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: erreur ? false : true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {}
    }
  }

  private async mettreAJourLeSchema(connexion: Sequelize): Promise<void> {
    await connexion.query(`
      ALTER TABLE evenement_engagement 
          ADD COLUMN IF NOT EXISTS "semaine" DATE,
          ADD COLUMN IF NOT EXISTS "agence" varchar,
          ADD COLUMN IF NOT EXISTS "departement" varchar,
          ADD COLUMN IF NOT EXISTS "region" varchar;
    `)
  }

  private async dropperLesIndex(connexion: Sequelize): Promise<void> {
    await connexion.query(`
      drop index if exists evenement_engagement_semaine_index;
      drop index if exists evenement_engagement_agence_index;
      drop index if exists evenement_engagement_departement_index;
      drop index if exists evenement_engagement_region_index;
    `)
  }

  private async indexerLesColonnes(connexion: Sequelize): Promise<void> {
    await connexion.query(`
      create index evenement_engagement_semaine_index on evenement_engagement (semaine);
      create index evenement_engagement_agence_index on evenement_engagement (agence);
      create index evenement_engagement_departement_index on evenement_engagement (departement);
      create index evenement_engagement_region_index on evenement_engagement (region);
    `)
  }

  private async ajouterLesAgencesConseiller(
    connexion: Sequelize
  ): Promise<void> {
    await connexion.query(`
      UPDATE evenement_engagement
      SET agence=subquery.nom_agence,
          departement=subquery.code_departement,
          region=subquery.nom_region
      FROM (select
              evenement_engagement.id,
              a.nom_agence,
              a.code_departement,
              a.nom_region
            from evenement_engagement
                   left join conseiller c on evenement_engagement.id_utilisateur = c.id
                   left join agence a on c.id_agence = a.id
            where type_utilisateur='CONSEILLER') as subquery
      WHERE evenement_engagement.id = subquery.id;
    `)
  }

  private async ajouterLesAgencesJeune(connexion: Sequelize): Promise<void> {
    await connexion.query(`
        UPDATE evenement_engagement
        SET agence=subquery.nom_agence,
            departement=subquery.code_departement,
            region=subquery.nom_region
        FROM (select evenement_engagement.id,
                     a.nom_agence,
                     a.code_departement,
                     a.nom_region
              from evenement_engagement
                       left join jeune j on evenement_engagement.id_utilisateur = j.id
                       left join conseiller c on j.id_conseiller = c.id
                       left join agence a on c.id_agence = a.id
              where type_utilisateur = 'JEUNE') as subquery
        WHERE evenement_engagement.id = subquery.id;
    `)
  }

  private async determinerLaSemaine(connexion: Sequelize): Promise<void> {
    await connexion.query(`update evenement_engagement
                           set semaine = date_trunc('week', date_evenement)
                           where true;`)
  }
}
