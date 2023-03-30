import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { Sequelize } from 'sequelize-typescript'
import { DateTime } from 'luxon'

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

  async handle(_job: Planificateur.Job): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()
    const semaine = maintenant.startOf('week').minus({ week: 1 })
    const connexion = await createSequelizeForAnalytics()
    await this.mettreAJourLeSchema(connexion)
    await this.dropperLesIndex(connexion)
    await Promise.all([
      this.chargerLaVueFonctionnalite(connexion, semaine, 'CONSEILLER'),
      this.chargerLaVueFonctionnalite(connexion, semaine, 'JEUNE')
    ])
    await this.indexerLesColonnes(connexion)
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
      CREATE TABLE IF NOT EXISTS fonctionnalites_conseiller
      (
        semaine                date,
        nb_ae                  integer,
        nb_user_total          integer,
        nb_user_cat            integer,
        nb_user_cat_action     integer,
        nb_user_cat_action_nom integer,
        tot_users              integer,
        categorie              varchar,
        action                 varchar,
        nom                    varchar,
        structure              varchar
      );
    `)
  }

  private async dropperLesIndex(connexion: Sequelize): Promise<void> {
    await connexion.query(`
      drop index if exists fonctionnalites_conseiller_semaine_index;
      drop index if exists fonctionnalites_conseiller_categorie_index;
      drop index if exists fonctionnalites_conseiller_action_index;
      drop index if exists fonctionnalites_conseiller_nom_index;
      drop index if exists fonctionnalites_conseiller_structure_index;
    `)
  }

  private async indexerLesColonnes(connexion: Sequelize): Promise<void> {
    await connexion.query(`
      create index fonctionnalites_conseiller_semaine_index on fonctionnalites_conseiller (semaine);
      create index fonctionnalites_conseiller_categorie_index on fonctionnalites_conseiller (categorie);
      create index fonctionnalites_conseiller_action_index on fonctionnalites_conseiller (action);
      create index fonctionnalites_conseiller_nom_index on fonctionnalites_conseiller (nom);
      create index fonctionnalites_conseiller_structure_index on fonctionnalites_conseiller (structure);
    `)
  }

  private async chargerLaVueFonctionnalite(
    connexion: Sequelize,
    semaine: DateTime,
    typeUtilisateur: string
  ): Promise<void> {
    const semaineFormattee = `${semaine.toFormat('yyyy-MM-dd')}`
    await connexion.query(
      `DELETE
       from fonctionnalites_conseiller
       where semaine != '${semaineFormattee}';`
    )
    await connexion.query(`
        insert into fonctionnalites_conseiller(semaine,
                                               categorie,
                                               action,
                                               nom,
                                               structure,
                                               nb_ae,
                                               nb_user_total,
                                               nb_user_cat,
                                               nb_user_cat_action,
                                               nb_user_cat_action_nom)
        SELECT table_nom.semaine,
               table_nom.categorie,
               table_nom.action,
               table_nom.nom,
               table_nom.structure,
               NULLIF(MIN(nb_ae), 0)           as nb_ae,
               SUM(nb_users_tot)               as nb_users,
               NULLIF(MIN(nb_users_cat), 0)    as nb_users_cat,
               NULLIF(MIN(nb_users_action), 0) as nb_users_action,
               NULLIF(MIN(nb_users_nom), 0)    as nb_users_nom
        FROM (SELECT COUNT(distinct id_utilisateur) as nb_users_nom,
                     semaine,
                     categorie,
                     action,
                     nom,
                     structure
              FROM evenement_engagement
              where structure is not null
                and structure != 'PASS_EMPLOI'
                and type_utilisateur = '${typeUtilisateur}'
                and semaine = '${semaineFormattee}'
              GROUP BY semaine, structure, categorie, action, nom) as table_nom
                 INNER JOIN (SELECT COUNT(distinct id_utilisateur) as nb_users_cat,
                                    semaine,
                                    structure,
                                    categorie
                             FROM evenement_engagement
                             where structure is not null
                               and structure != 'PASS_EMPLOI'
                               and type_utilisateur = '${typeUtilisateur}'
                               and semaine = '${semaineFormattee}'
                             GROUP BY semaine, structure, categorie) as table_cat
                            ON table_nom.semaine = table_cat.semaine and table_nom.structure = table_cat.structure and
                               table_nom.categorie = table_cat.categorie
                 INNER JOIN (SELECT COUNT(distinct id_utilisateur) as nb_users_action,
                                    semaine,
                                    structure,
                                    categorie,
                                    action
                             FROM evenement_engagement
                             where structure is not null
                               and structure != 'PASS_EMPLOI'
                               and type_utilisateur = '${typeUtilisateur}'
                               and semaine = '${semaineFormattee}'
                             GROUP BY semaine, structure, categorie, action) as table_action
                            ON table_nom.semaine = table_action.semaine and
                               table_nom.structure = table_action.structure and
                               table_nom.categorie = table_action.categorie and table_nom.action = table_action.action
                 INNER JOIN (SELECT count(*)                       as nb_ae,
                                    COUNT(distinct id_utilisateur) as nb_users_tot,
                                    semaine,
                                    structure
                             FROM evenement_engagement
                             where structure is not null
                               and structure != 'PASS_EMPLOI'
                               and type_utilisateur = '${typeUtilisateur}'
                               and semaine = '${semaineFormattee}'
                             GROUP BY semaine, structure) as table_tot
                            ON table_nom.semaine = table_nom.semaine and table_nom.structure = table_tot.structure
        GROUP BY table_nom.semaine, table_nom.structure, table_nom.categorie, table_nom.action, table_nom.nom
        ORDER BY table_nom.categorie, table_nom.action, table_nom.nom, table_nom.structure
    `)
  }
}
