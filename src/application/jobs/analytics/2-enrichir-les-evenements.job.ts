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
    await this.ajouterLesAgencesConseiller(connexion)
    await this.ajouterLesAgencesJeune(connexion)
    await this.determinerLaSemaineALaFinDuTraitement(connexion)
    await this.indexerLesColonnes(connexion)

    const jobRechargerLesVues: Planificateur.Job<void> = {
      dateExecution: this.dateService.nowJs(),
      type: Planificateur.JobType.CHARGER_LES_VUES_ANALYTICS,
      contenu: undefined
    }
    await this.planificateurRepository.creerJob(jobRechargerLesVues)

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

  private async mettreAJourLeSchema(connexion: Sequelize): Promise<void> {
    await connexion.query(`
      ALTER TABLE evenement_engagement
        ADD COLUMN IF NOT EXISTS "semaine"     DATE,
        ADD COLUMN IF NOT EXISTS "agence"      varchar,
        ADD COLUMN IF NOT EXISTS "departement" varchar,
        ADD COLUMN IF NOT EXISTS "region"      varchar;
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
        FROM (select conseiller.id,
                     nom_agence,
                     code_departement,
                     nom_region
              from conseiller
                       left join agence on conseiller.id_agence = agence.id
              where id_agence is not null) as subquery
        WHERE evenement_engagement.id_utilisateur = subquery.id
          and evenement_engagement.type_utilisateur = 'CONSEILLER'
          and evenement_engagement.agence is null
          and evenement_engagement.semaine is null;
    `)
  }

  private async ajouterLesAgencesJeune(connexion: Sequelize): Promise<void> {
    await connexion.query(`
        UPDATE evenement_engagement
        SET agence=subquery.nom_agence,
            departement=subquery.code_departement,
            region=subquery.nom_region
        FROM (select jeune.id,
                     nom_agence,
                     code_departement,
                     nom_region
              from jeune
                       left join conseiller on jeune.id_conseiller = conseiller.id
                       left join agence on conseiller.id_agence = agence.id
              where id_agence is not null) as subquery
        WHERE evenement_engagement.id_utilisateur = subquery.id
          and evenement_engagement.type_utilisateur = 'JEUNE'
          and evenement_engagement.agence is null
          and  evenement_engagement.semaine is null;
    `)
  }

  private async determinerLaSemaineALaFinDuTraitement(
    connexion: Sequelize
  ): Promise<void> {
    await connexion.query(`update evenement_engagement
                           set semaine = date_trunc('week', date_evenement)
                           where semaine is null;`)
  }
}
