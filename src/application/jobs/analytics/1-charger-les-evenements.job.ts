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
import {
  getConnexionToDBSource,
  getConnexionToDBTarget
} from '../../../infrastructure/sequelize/connector-analytics'
import { PoolClient } from 'pg'
import { from as copyFrom, to as copyTo } from 'pg-copy-streams'
import { pipeline } from 'node:stream/promises'

const TAILLE_DU_BATCH = 150000

@Injectable()
@ProcessJobType(Planificateur.JobType.CHARGER_EVENEMENTS_ANALYTICS)
export class ChargerEvenementsJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.CHARGER_EVENEMENTS_ANALYTICS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    let nombreDevemementsACharger
    let nombreDevenementsTargetBefore
    let nombreDevenementsTargetAfter
    const maintenant = this.dateService.now()
    const connexionSource = await getConnexionToDBSource()
    const connexionTarget = await getConnexionToDBTarget()

    try {
      await this.mettreAJourLeSchema(connexionTarget.client)
      await this.indexerLesColonnes(connexionTarget.client)
      nombreDevenementsTargetBefore =
        await this.recupererLeNombreDEvenementsTarget(connexionTarget.client)

      nombreDevemementsACharger = await this.ajouterLesNouveauxEvenements(
        connexionSource.client,
        connexionTarget.client
      )

      nombreDevenementsTargetAfter =
        await this.recupererLeNombreDEvenementsTarget(connexionTarget.client)

      const jobEnrichirLesEvenements: Planificateur.Job<void> = {
        dateExecution: this.dateService.nowJs(),
        type: Planificateur.JobType.ENRICHIR_EVENEMENTS_ANALYTICS,
        contenu: undefined
      }
      await this.planificateurRepository.ajouterJob(jobEnrichirLesEvenements)

      if (maintenant.weekday === JOUR_DE_LA_SEMAINE_LUNDI) {
        const jobNettoyerLesEvenements: Planificateur.Job<void> = {
          dateExecution: this.dateService.nowJs(),
          type: Planificateur.JobType.NETTOYER_EVENEMENTS_CHARGES_ANALYTICS,
          contenu: undefined
        }
        await this.planificateurRepository.ajouterJob(jobNettoyerLesEvenements)
      }
    } finally {
      await connexionSource.close()
      await connexionTarget.close()
    }
    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: erreur ? false : true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {
        nombreDevemementsACharger,
        nombreDevenementsTargetBefore,
        nombreDevenementsTargetAfter
      }
    }
  }

  private async mettreAJourLeSchema(clientTarget: PoolClient): Promise<void> {
    this.logger.log('Mise à jour du schéma de la base de données cible')
    await clientTarget.query(`
      CREATE TABLE IF NOT EXISTS evenement_engagement
      (
        id               serial,
        date_evenement   timestamp with time zone,
        categorie        varchar(255),
        action           varchar(255),
        nom              varchar(255),
        id_utilisateur   varchar(255),
        type_utilisateur varchar(255),
        structure        varchar(255),
        code             varchar(255)
      );
    `)
  }

  private async indexerLesColonnes(clientTarget: PoolClient): Promise<void> {
    this.logger.log('Indexation des colonnes')
    await clientTarget.query(`
      create index if not exists evenement_engagement_date_evenement_index on evenement_engagement (date_evenement);
      create index if not exists evenement_engagement_categorie_index on evenement_engagement (categorie);
      create index if not exists evenement_engagement_action_index on evenement_engagement (action);
      create index if not exists evenement_engagement_nom_index on evenement_engagement (nom);
      create index if not exists evenement_engagement_id_utilisateur_index on evenement_engagement (id_utilisateur);
      create index if not exists evenement_engagement_type_utilisateur_index on evenement_engagement (type_utilisateur);
      create index if not exists evenement_engagement_structure_index on evenement_engagement (structure);
      create index if not exists evenement_engagement_code_index on evenement_engagement (code);
    `)
  }

  private async ajouterLesNouveauxEvenements(
    clientSource: PoolClient,
    clientTarget: PoolClient
  ): Promise<number> {
    this.logger.log('Ajout des nouveaux événements')

    const dateDernierEvenementCharge = await this.getDateDernierEvenementCharge(
      clientTarget
    )
    const nombreDEvenementACharger = await this.getNombreDEvenementACharger(
      clientSource,
      dateDernierEvenementCharge
    )

    const nombreDeBatches = Math.ceil(
      nombreDEvenementACharger / TAILLE_DU_BATCH
    )

    for (
      let numeroBatchActuel = 0;
      numeroBatchActuel < nombreDeBatches;
      numeroBatchActuel++
    ) {
      const streamCopyToStdout = clientSource.query(
        copyTo(
          `COPY (
            SELECT 
              * 
            FROM (
              SELECT
                evenement_engagement_hebdo.id,
                evenement_engagement_hebdo.date_evenement,
                evenement_engagement_hebdo.categorie,
                evenement_engagement_hebdo.action,
                evenement_engagement_hebdo.nom,
                evenement_engagement_hebdo.id_utilisateur,
                evenement_engagement_hebdo.type_utilisateur,
                CASE 
                  WHEN (evenement_engagement_hebdo.structure = 'MILO' AND jeune.dispositif = 'PACEA') THEN 'MILO_PACEA'
                  ELSE evenement_engagement_hebdo.structure
                END AS structure,
                code
              FROM
                evenement_engagement_hebdo
              LEFT JOIN
                jeune
              ON evenement_engagement_hebdo.id_utilisateur = jeune.id
            ) as subquery
            WHERE date_evenement>'${dateDernierEvenementCharge}'
            ORDER BY date_evenement ASC
            LIMIT ${TAILLE_DU_BATCH}
            OFFSET ${numeroBatchActuel * TAILLE_DU_BATCH}
          )
          TO STDOUT WITH NULL '\\LA_VALEUR_NULL'`
        )
      )
      const streamCopyFromStdin = clientTarget.query(
        copyFrom(
          `COPY evenement_engagement (id,
                           date_evenement,
                           categorie,
                           action,
                           nom,
                           id_utilisateur,
                           type_utilisateur,
                           structure,
                           code) FROM STDIN WITH NULL AS '\\LA_VALEUR_NULL'`
        )
      )
      await pipeline(streamCopyToStdout, streamCopyFromStdin)
    }
    return nombreDEvenementACharger
  }

  private async getDateDernierEvenementCharge(
    clientTarget: PoolClient
  ): Promise<string> {
    this.logger.log('Récupération du dernier événement chargé')
    const result = await clientTarget.query(
      `SELECT to_char(MAX(date_evenement), 'YYYY-MM-DD"T"HH24:MI:SS.MS OF') as max
       from evenement_engagement;`
    )

    const dateDernierEvenementCharge =
      result.rows[0].max ?? '2000-01-01T00:00:00'

    this.logger.log(dateDernierEvenementCharge)
    return dateDernierEvenementCharge
  }

  private async getNombreDEvenementACharger(
    clientSource: PoolClient,
    dateDernierEvenementCharge: string
  ): Promise<number> {
    this.logger.log("Récupération du nombre d'événements à charger")
    const result = await clientSource.query(
      `SELECT count(*) as compte
       from evenement_engagement_hebdo
       where date_evenement > '${dateDernierEvenementCharge}';`
    )
    return Number(result.rows[0].compte ?? '0')
  }

  private async recupererLeNombreDEvenementsTarget(
    clientTarget: PoolClient
  ): Promise<number> {
    this.logger.log("Récupération du nombre d'événements sur la base cible")

    const { rows } = await clientTarget.query(
      `SELECT count(*) as comptetarget
       from evenement_engagement;`
    )
    return Number(rows[0].comptetarget ?? '0')
  }
}
