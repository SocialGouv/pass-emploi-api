import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import {
  DateService,
  JOUR_DE_LA_SEMAINE_LUNDI
} from '../../../utils/date-service'
import { createSequelizeForAnalytics } from '../../../infrastructure/sequelize/connector-analytics'
import { Sequelize } from 'sequelize-typescript'
import {
  infosTablesAEAnnuelles,
  InfoTableAEAnnuelle
} from './creer-tables-ae-annuelles'

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

  async handle(): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()
    try {
      const connexion = await createSequelizeForAnalytics()
      await this.mettreAJourLeSchema(connexion)
      await this.indexerLesColonnes(connexion)
      await this.mettreAJourLaStructure(connexion)
      await this.creerTableAEJeune(connexion)
      await this.ajouterLesAgencesConseiller(connexion)
      await this.ajouterLesAgencesJeune(connexion)
      await this.determinerLaSemaineEtLeJourALaFinDuTraitement(connexion)

      await this.enrichirTableAEJeune(connexion)
      await this.associerChaqueConseillerASonDernierAE(connexion)
      await this.associerChaqueConseillerASonPremierAE(connexion)

      await this.mettreAJourLaStructureSelonDispositif(connexion)

      await connexion.close()

      if (maintenant.weekday === JOUR_DE_LA_SEMAINE_LUNDI) {
        const jobCalculerLesVues: Planificateur.Job<void> = {
          dateExecution: this.dateService.nowJs(),
          type: Planificateur.JobType.CHARGER_LES_VUES_ANALYTICS,
          contenu: undefined
        }
        await this.planificateurRepository.ajouterJob(jobCalculerLesVues)
      }
    } catch (e) {
      erreur = e
      this.logger.error(e)
    }

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: !erreur,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {}
    }
  }

  private async mettreAJourLeSchema(connexion: Sequelize): Promise<void> {
    this.logger.log('Mise à jour du schéma')
    await connexion.query(`
      ALTER TABLE evenement_engagement
        ADD COLUMN IF NOT EXISTS "semaine"     DATE,
        ADD COLUMN IF NOT EXISTS "jour"        DATE,
        ADD COLUMN IF NOT EXISTS "agence"      varchar,
        ADD COLUMN IF NOT EXISTS "departement" varchar,
        ADD COLUMN IF NOT EXISTS "region"      varchar;
    `)
    await connexion.query(`
      ALTER TABLE conseiller
        ADD COLUMN IF NOT EXISTS "date_dernier_ae"     TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "date_premier_ae"     TIMESTAMP;
    `)
    await connexion.query(`
      ALTER TABLE archive_jeune
        DROP COLUMN IF EXISTS donnees;
    `)
  }

  private async indexerLesColonnes(connexion: Sequelize): Promise<void> {
    this.logger.log('Indexation des colonnes')
    await connexion.query(`
      create index if not exists evenement_engagement_semaine_index on evenement_engagement (semaine);
      create index if not exists evenement_engagement_jour_index on evenement_engagement (jour);
      create index if not exists evenement_engagement_agence_index on evenement_engagement (agence);
      create index if not exists evenement_engagement_departement_index on evenement_engagement (departement);
      create index if not exists evenement_engagement_region_index on evenement_engagement (region);
    `)
  }

  private async mettreAJourLaStructure(
    connexion: Sequelize
  ): Promise<void> {
    this.logger.log('Mise à jour de la structure en fonction du dispositif')
    await connexion.query(`
      UPDATE evenement_engagement
      SET structure = 'MILO_PACEA'
      FROM (
        SELECT id 
        FROM jeune
        WHERE structure = 'MILO' AND dispositif = 'PACEA'
        ) AS subquery
      WHERE evenement_engagement.id_utilisateur = subquery.id
        AND evenement_engagement.type_utilisateur = 'JEUNE'
        AND evenement_engagement.structure = 'MILO'
      ;
    `)
  }

  private async ajouterLesAgencesConseiller(
    connexion: Sequelize
  ): Promise<void> {
    this.logger.log('Ajout des agences des conseillers')
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
    this.logger.log('Ajout des agences des jeunes')
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
        and evenement_engagement.semaine is null;
    `)
  }

  private async determinerLaSemaineEtLeJourALaFinDuTraitement(
    connexion: Sequelize
  ): Promise<void> {
    this.logger.log('Détermination de la semaine et du jour')
    await connexion.query(`update evenement_engagement
                           set semaine = date_trunc('week', date_evenement),
                               jour    = date_trunc('day', date_evenement)
                           where semaine is null;`)
  }

  private async associerChaqueConseillerASonDernierAE(
    connexion: Sequelize
  ): Promise<void> {
    this.logger.log('Associer chaque conseiller à la date de son dernier AE')

    for (const tableAnnuelle of infosTablesAEAnnuelles) {
      await updateDateDernierAEConseiller(connexion, tableAnnuelle)
    }
  }

  private async associerChaqueConseillerASonPremierAE(
    connexion: Sequelize
  ): Promise<void> {
    this.logger.log('Associer chaque conseiller à la date de son premier AE')
    for (
      let indexTable = infosTablesAEAnnuelles.length - 1;
      indexTable >= 0;
      indexTable--
    ) {
      await updateDatePremierAEConseiller(
        connexion,
        infosTablesAEAnnuelles[indexTable]
      )
    }
  }

  private async creerTableAEJeune(connexion: Sequelize): Promise<void> {
    this.logger.log('Création vue AE Jeune')
    await connexion.query(`
      CREATE TABLE IF NOT EXISTS evenement_engagement_jeune
      (
        id_utilisateur              varchar(255),
        structure                   varchar,
        nb_action_cree              integer,
        nb_message_envoye           integer,
        nb_consultation_rdv         integer,
        nb_consultation_offre       integer,
        nb_postuler_offre           integer,
        nb_consultation_evenement   integer,
        date_premier_ae             timestamp with time zone,
        date_dernier_ae             timestamp with time zone
      );
    `)
  }

  private async enrichirTableAEJeune(connexion: Sequelize): Promise<void> {
    this.logger.log('Mise à jour de la vue AE Jeune')
    await connexion.query(`TRUNCATE TABLE evenement_engagement_jeune;`)

    const withTables = infosTablesAEAnnuelles
      .map(tableAnnuelle => getQueryTableAEJeune(tableAnnuelle))
      .join(', ')

    const fromTable = infosTablesAEAnnuelles.map(tableAnnuelle => {
      let tableAeJeuneAnnuelle = `SELECT * FROM ae_jeune${tableAnnuelle.suffix}`
      if (
        tableAnnuelle.depuisAnnee !==
        infosTablesAEAnnuelles[infosTablesAEAnnuelles.length - 1].depuisAnnee
      ) {
        tableAeJeuneAnnuelle += '  UNION ALL '
      }
      return tableAeJeuneAnnuelle
    })

    const query = `INSERT INTO evenement_engagement_jeune (
      id_utilisateur, 
      structure, 
      nb_action_cree, 
      nb_message_envoye, 
      nb_consultation_rdv, 
      nb_consultation_offre, 
      nb_postuler_offre, 
      nb_consultation_evenement, 
      date_premier_ae, 
      date_dernier_ae
    )
    WITH ${withTables}
    SELECT
        id_utilisateur,
        structure,
        sum(nb_action_cree) AS nb_action_cree,
        sum(nb_message_envoye) AS nb_message_envoye,
        sum(nb_consultation_rdv) AS nb_consultation_rdv,
        sum(nb_consultation_offre) AS nb_consultation_offre,
        sum(nb_postuler_offre) AS nb_postuler_offre,
        sum(nb_consultation_evenement) AS nb_consultation_evenement,
        min(date_premier_ae) AS date_premier_ae,
        max(date_dernier_ae) AS date_dernier_ae
      FROM ( ${fromTable.join('')} ) AS concat_tables
          GROUP BY
            id_utilisateur,
            structure;
    `
    await connexion.query(query)
  }

  private async mettreAJourLaStructureSelonDispositif(
    connexion: Sequelize
  ): Promise<void> {
    this.logger.log('Mise à jour de la structure en fonction du dispositif')
    await connexion.query(`
      UPDATE evenement_engagement
      SET structure = 'MILO_PACEA'
      FROM (
        SELECT id 
        FROM jeune
        WHERE structure = 'MILO' AND dispositif = 'PACEA'
        ) AS subquery
      WHERE evenement_engagement.id_utilisateur = subquery.id
        AND evenement_engagement.type_utilisateur = 'JEUNE'
        AND evenement_engagement.structure = 'MILO'
      ;
    `)
    await connexion.query(`
      UPDATE evenement_engagement
      SET structure = 'MILO'
      FROM (
        SELECT id 
        FROM jeune
        WHERE structure = 'MILO' AND dispositif = 'CEJ'
        ) AS subquery
      WHERE evenement_engagement.id_utilisateur = subquery.id
        AND evenement_engagement.type_utilisateur = 'JEUNE'
        AND evenement_engagement.structure = 'MILO_PACEA'
      ;
    `)
    await connexion.query(`
      UPDATE evenement_engagement_jeune eej
      SET structure = 'MILO_PACEA'
      WHERE structure = 'MILO'
      AND EXISTS 
        (SELECT 1 FROM jeune j WHERE j.id = eej.id_utilisateur AND j.structure = 'MILO' AND j.dispositif = 'PACEA');
    `)
    await connexion.query(`
      UPDATE evenement_engagement_jeune eej
      SET structure = 'MILO'
      WHERE structure = 'MILO_PACEA'
      AND EXISTS 
        (SELECT 1 FROM jeune j WHERE j.id = eej.id_utilisateur AND j.structure = 'MILO' AND j.dispositif = 'CEJ');
    `)
  }
}

async function updateDateDernierAEConseiller(
  connexion: Sequelize,
  tableAE: InfoTableAEAnnuelle
): Promise<void> {
  const tableName = `evenement_engagement${tableAE.suffix}`
  const conditionDate = `AND EXTRACT(YEAR FROM date_evenement) >= ${tableAE.depuisAnnee}`

  await connexion.query(`
    update conseiller
    set date_dernier_ae = dernier_ae_conseiller.date_dernier_ae
    from (
        select id_utilisateur, max(date_evenement) as date_dernier_ae
        from ${tableName}
        where type_utilisateur = 'CONSEILLER' ${conditionDate}
        group by id_utilisateur
    ) as dernier_ae_conseiller
    where conseiller.id = dernier_ae_conseiller.id_utilisateur;`)
}
async function updateDatePremierAEConseiller(
  connexion: Sequelize,
  tableAE: InfoTableAEAnnuelle
): Promise<void> {
  const tableName = `evenement_engagement${tableAE.suffix}`
  const conditionDate = `AND EXTRACT(YEAR FROM date_evenement) >= ${tableAE.depuisAnnee}`

  await connexion.query(`
    update conseiller
    set date_premier_ae = premier_ae_conseiller.date_premier_ae
    from (
        select id_utilisateur, min(date_evenement) as date_premier_ae
        from ${tableName}
        where type_utilisateur = 'CONSEILLER' ${conditionDate}
        group by id_utilisateur
    ) as premier_ae_conseiller
    where conseiller.id = premier_ae_conseiller.id_utilisateur;`)
}

function getQueryTableAEJeune(tableAE: InfoTableAEAnnuelle): string {
  const tableAEName = `ae${tableAE.suffix}`
  const groupedTableAEName = `ae_jeune${tableAE.suffix}`
  const tableName = `evenement_engagement${tableAE.suffix}`
  const conditionDate = `AND EXTRACT(YEAR FROM date_evenement) >= ${tableAE.depuisAnnee}`

  return `${tableAEName} AS (
      SELECT
        id_utilisateur,
        structure,
        date_evenement,
        CASE
          WHEN categorie = 'Action'
          AND ACTION = 'Création'
          OR code = 'ACTION_CREE' THEN 1
          ELSE 0
        END AS creation_action,
        CASE
          WHEN categorie = 'Message'
          AND ACTION = 'Envoi' THEN 1
          ELSE 0
        END AS envoi_message,
        CASE
          WHEN categorie = 'Rendez-vous'
          AND ACTION = 'Consultation' THEN 1
          ELSE 0
        END AS consultation_rdv,
        CASE
          WHEN categorie = 'Offre'
          AND (
            ACTION = 'Recherche'
            OR ACTION = 'Détail'
            OR ACTION = 'favori'
          ) THEN 1
          ELSE 0
        END AS consultation_offre,
        CASE
          WHEN categorie = 'Offre'
          AND ACTION = 'Postuler' THEN 1
          ELSE 0
        END AS postuler_offre,
        CASE
          WHEN categorie = 'Evénement' THEN 1
          ELSE 0
        END AS consultation_evenement
      FROM
        ${tableName}
      WHERE
        type_utilisateur = 'JEUNE'
        ${conditionDate}
    ),
    ${groupedTableAEName} AS (
      SELECT
        id_utilisateur,
        sum(creation_action) AS nb_action_cree,
        sum(envoi_message) AS nb_message_envoye,
        sum(consultation_rdv) AS nb_consultation_rdv,
        sum(consultation_offre) AS nb_consultation_offre,
        sum(postuler_offre) AS nb_postuler_offre,
        sum(consultation_evenement) AS nb_consultation_evenement,
        min(date_evenement) AS date_premier_ae,
        max(date_evenement) AS date_dernier_ae,
        structure
      FROM
        ${tableAEName}
      GROUP BY
        id_utilisateur,
        structure
    )
  `
}
