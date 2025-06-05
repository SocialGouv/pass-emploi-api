import { Inject, Injectable } from '@nestjs/common'
import { pipeline } from 'node:stream/promises'
import { PoolClient } from 'pg'
import { from as copyFrom, to as copyTo } from 'pg-copy-streams'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { getConnexionToDBTarget } from '../../../infrastructure/sequelize/connector-analytics'
import { DateService } from '../../../utils/date-service'

const ANNEE_A_TRAITER = 2024

interface PgConnexion {
  client: PoolClient
  close: () => Promise<void>
}

export interface InfoTableAEAnnuelle {
  depuisAnnee: number
  suffix: string
}
export const infosTablesAEAnnuelles: InfoTableAEAnnuelle[] = [
  { depuisAnnee: 2022, suffix: '_2022' },
  { depuisAnnee: 2023, suffix: '_2023' },
  { depuisAnnee: 2024, suffix: '_2024' },
  { depuisAnnee: 2025, suffix: '' }
]

@Injectable()
@ProcessJobType(Planificateur.JobType.CREER_TABLES_AE_ANNUELLES_ANALYTICS)
export class CreerTablesAEAnnuellesJobHandler extends JobHandler<Planificateur.Job> {
  private connexionSource: PgConnexion | undefined
  private connexionTarget: PgConnexion | undefined
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private readonly dateService: DateService
  ) {
    super(
      Planificateur.JobType.CREER_TABLES_AE_ANNUELLES_ANALYTICS,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    let erreur: Error | undefined

    try {
      this.connexionSource = await getConnexionToDBTarget()
      this.connexionTarget = await getConnexionToDBTarget()

      for (const tableAnnuelle of infosTablesAEAnnuelles) {
        if (
          tableAnnuelle.suffix !== '' &&
          tableAnnuelle.depuisAnnee === ANNEE_A_TRAITER
        )
          await this.calculAnnuel(tableAnnuelle.depuisAnnee.toString())
      }
    } catch (e) {
      erreur = e
    } finally {
      if (this.connexionSource) await this.connexionSource.close()
      if (this.connexionTarget) await this.connexionTarget.close()
    }

    const maintenant = this.dateService.now()
    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: erreur ? false : true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: erreur ?? {}
    }
  }

  private async calculAnnuel(annee: string): Promise<void> {
    try {
      await this.creerUneTableAnnuelle(this.connexionTarget!.client, annee)
      await this.indexerLesColonnes(this.connexionTarget!.client, annee)

      const filtreEvenements = `WHERE semaine between '${annee}-01-01'::timestamp - interval '2 months' and '${annee}-12-31'::timestamp`
      const compteEvenements = await this.compteEvenementsAnnuels(
        this.connexionTarget!.client,
        filtreEvenements
      )
      await this.remplirLaTableAnnuelle(
        this.connexionSource!.client,
        this.connexionTarget!.client,
        compteEvenements,
        filtreEvenements,
        annee
      )
    } catch (e) {
      this.logger.error(e)
    }
  }

  private async creerUneTableAnnuelle(
    clientTarget: PoolClient,
    annee: string
  ): Promise<void> {
    this.logger.log('Création table annuelle ' + annee)
    await clientTarget.query(`
      CREATE TABLE IF NOT EXISTS evenement_engagement_${annee} AS
          TABLE evenement_engagement
          WITH NO DATA;`)
  }

  private async indexerLesColonnes(
    clientTarget: PoolClient,
    annee: string
  ): Promise<void> {
    this.logger.log(`Indexation des colonnes table ${annee}`)
    await clientTarget.query(`
      create index if not exists evenement_engagement_${annee}_date_evenement_index on evenement_engagement_${annee} (date_evenement);
      create index if not exists evenement_engagement_${annee}_categorie_index on evenement_engagement_${annee} (categorie);
      create index if not exists evenement_engagement_${annee}_action_index on evenement_engagement_${annee} (action);
      create index if not exists evenement_engagement_${annee}_nom_index on evenement_engagement_${annee} (nom);
      create index if not exists evenement_engagement_${annee}_id_utilisateur_index on evenement_engagement_${annee} (id_utilisateur);
      create index if not exists evenement_engagement_${annee}_type_utilisateur_index on evenement_engagement_${annee} (type_utilisateur);
      create index if not exists evenement_engagement_${annee}_structure_index on evenement_engagement_${annee} (structure);
      create index if not exists evenement_engagement_${annee}_code_index on evenement_engagement_${annee} (code);
      create index if not exists evenement_engagement_${annee}_semaine_index on evenement_engagement_${annee} (semaine);
      create index if not exists evenement_engagement_${annee}_jour_index on evenement_engagement_${annee} (jour);
      create index if not exists evenement_engagement_${annee}_agence_index on evenement_engagement_${annee} (agence);
      create index if not exists evenement_engagement_${annee}_departement_index on evenement_engagement_${annee} (departement);
      create index if not exists evenement_engagement_${annee}_region_index on evenement_engagement_${annee} (region);
  `)
  }

  private async compteEvenementsAnnuels(
    clientSource: PoolClient,
    filtreEvenemnts: string
  ): Promise<number> {
    this.logger.log("Récupération du nombre d'événements")
    const compteEvenementAnnee = await clientSource.query(`
      SELECT count(*) as compteannee
      FROM evenement_engagement ${filtreEvenemnts}
  `)
    const nb = Number(compteEvenementAnnee.rows[0].compteannee ?? '0')
    this.logger.log("Nombre d'événements : " + nb)
    return nb
  }

  private async remplirLaTableAnnuelle(
    clientSource: PoolClient,
    clientTarget: PoolClient,
    nombreEvenements: number,
    filtreEvenements: string,
    annee: string
  ): Promise<void> {
    this.logger.log('Copie des événements par batch')
    const TAILLE_DU_BATCH = 150000
    const nombreDeBatches = Math.ceil(nombreEvenements / TAILLE_DU_BATCH)

    for (
      let numeroBatchActuel = 0;
      numeroBatchActuel < nombreDeBatches;
      numeroBatchActuel++
    ) {
      this.logger.log(`Batch ${numeroBatchActuel + 1}/${nombreDeBatches}`)
      const streamCopyToStdout = clientSource.query(
        copyTo(
          `COPY (SELECT * FROM evenement_engagement
               ${filtreEvenements}
               ORDER BY date_evenement ASC
               LIMIT ${TAILLE_DU_BATCH}
               OFFSET ${numeroBatchActuel * TAILLE_DU_BATCH})
         TO STDOUT WITH NULL '\\LA_VALEUR_NULL'`
        )
      )
      const streamCopyFromStdin = clientTarget.query(
        copyFrom(
          `COPY evenement_engagement_${annee} FROM STDIN WITH NULL AS '\\LA_VALEUR_NULL'`
        )
      )
      await pipeline(streamCopyToStdout, streamCopyFromStdin)
      this.logger.log('fin pipe')
    }
  }
}
