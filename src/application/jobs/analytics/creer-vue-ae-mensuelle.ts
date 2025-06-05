import { Inject, Injectable } from '@nestjs/common'
import { pipeline } from 'node:stream/promises'
import { PoolClient } from 'pg'
import { from as copyFrom, to as copyTo } from 'pg-copy-streams'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { getConnexionToDBTarget } from '../../../infrastructure/sequelize/connector-analytics'
import { DateService } from '../../../utils/date-service'

const mois = '04_2025'
const dateDebut = '2025-04-01'
const dateFin = '2025-05-01'

interface PgConnexion {
  client: PoolClient
  close: () => Promise<void>
}

@Injectable()
@ProcessJobType(Planificateur.JobType.CREER_VUE_AE_MENSUELLE)
export class CreerVueAEMensuelleJobHandler extends JobHandler<Planificateur.Job> {
  private connexionSource: PgConnexion | undefined
  private connexionTarget: PgConnexion | undefined

  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private readonly dateService: DateService
  ) {
    super(Planificateur.JobType.CREER_VUE_AE_MENSUELLE, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur: Error | undefined

    try {
      this.connexionSource = await getConnexionToDBTarget()
      this.connexionTarget = await getConnexionToDBTarget()

      await this.creerUneTableMensuelle(this.connexionTarget.client, mois)
      await this.indexerLesColonnes(this.connexionTarget.client, mois)

      const filtreEvenements = `
      WHERE date_evenement >= '${dateDebut}T00:00:00.000'::timestamp
        AND date_evenement <  '${dateFin}T00:00:00.000'::timestamp`

      const nombreEvenements = await this.compteEvenementsMensuels(
        this.connexionTarget.client,
        filtreEvenements
      )

      this.logger.log('Copie des événements par batch')
      const TAILLE_DU_BATCH = 150000
      const nombreDeBatches = Math.ceil(nombreEvenements / TAILLE_DU_BATCH)

      for (
        let numeroBatchActuel = 0;
        numeroBatchActuel < nombreDeBatches;
        numeroBatchActuel++
      ) {
        this.logger.log(`Batch ${numeroBatchActuel + 1}/${nombreDeBatches}`)

        const streamCopyToStdout = this.connexionSource.client.query(
          copyTo(
            `COPY (SELECT * FROM evenement_engagement
               ${filtreEvenements}
               ORDER BY date_evenement ASC
               LIMIT ${TAILLE_DU_BATCH}
               OFFSET ${numeroBatchActuel * TAILLE_DU_BATCH})
         TO STDOUT WITH NULL '\\LA_VALEUR_NULL'`
          )
        )
        const streamCopyFromStdin = this.connexionTarget.client.query(
          copyFrom(
            `COPY evenement_engagement_${mois} FROM STDIN WITH NULL AS '\\LA_VALEUR_NULL'`
          )
        )
        await pipeline(streamCopyToStdout, streamCopyFromStdin)
        this.logger.log('fin pipe')
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

  private async creerUneTableMensuelle(
    clientTarget: PoolClient,
    mois: string
  ): Promise<void> {
    this.logger.log('Création table mensuelle ' + mois)
    await clientTarget.query(`
      CREATE TABLE IF NOT EXISTS evenement_engagement_${mois} AS
          TABLE evenement_engagement
          WITH NO DATA;`)
    this.logger.log('Nettoyage')
    await clientTarget.query(`TRUNCATE TABLE evenement_engagement_${mois};`)
  }

  private async indexerLesColonnes(
    clientTarget: PoolClient,
    mois: string
  ): Promise<void> {
    this.logger.log(
      `Indexation des colonnes table evenement_engagement_${mois}`
    )
    await clientTarget.query(`
      create index if not exists evenement_engagement_${mois}_date_evenement_index on evenement_engagement_${mois} (date_evenement);
      create index if not exists evenement_engagement_${mois}_categorie_index on evenement_engagement_${mois} (categorie);
      create index if not exists evenement_engagement_${mois}_action_index on evenement_engagement_${mois} (action);
      create index if not exists evenement_engagement_${mois}_nom_index on evenement_engagement_${mois} (nom);
      create index if not exists evenement_engagement_${mois}_id_utilisateur_index on evenement_engagement_${mois} (id_utilisateur);
      create index if not exists evenement_engagement_${mois}_type_utilisateur_index on evenement_engagement_${mois} (type_utilisateur);
      create index if not exists evenement_engagement_${mois}_structure_index on evenement_engagement_${mois} (structure);
      create index if not exists evenement_engagement_${mois}_code_index on evenement_engagement_${mois} (code);
      create index if not exists evenement_engagement_${mois}_semaine_index on evenement_engagement_${mois} (semaine);
      create index if not exists evenement_engagement_${mois}_jour_index on evenement_engagement_${mois} (jour);
      create index if not exists evenement_engagement_${mois}_agence_index on evenement_engagement_${mois} (agence);
      create index if not exists evenement_engagement_${mois}_departement_index on evenement_engagement_${mois} (departement);
      create index if not exists evenement_engagement_${mois}_region_index on evenement_engagement_${mois} (region);
  `)
  }

  private async compteEvenementsMensuels(
    clientSource: PoolClient,
    filtreEvenemnts: string
  ): Promise<number> {
    this.logger.log("Récupération du nombre d'événements")
    const compteEvenementAnnee = await clientSource.query(`
      SELECT count(*) as comptemois
      FROM evenement_engagement ${filtreEvenemnts}
  `)
    const nb = Number(compteEvenementAnnee.rows[0].comptemois ?? '0')
    this.logger.log("Nombre d'événements : " + nb)
    return nb
  }
}
