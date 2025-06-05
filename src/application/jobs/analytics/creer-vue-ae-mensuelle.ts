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
const dateFin = '2025-04-30'

interface PgConnexion {
  client: PoolClient
  close: () => Promise<void>
}

@Injectable()
@ProcessJobType(Planificateur.JobType.CREER_VUE_AE_MENSUELLE)
export class CreerVueAEMensuelleJobHandler extends JobHandler<Planificateur.Job> {
  private connexion: PgConnexion | undefined

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
      this.connexion = await getConnexionToDBTarget()

      await this.creerUneTableMensuelle(this.connexion.client, mois)
      await this.indexerLesColonnes(this.connexion.client, mois)

      const filtreEvenements = `WHERE semaine between '${dateDebut}'::timestamp and '${dateFin}'::timestamp`

      const streamCopyToStdout = this.connexion.client.query(
        copyTo(
          `COPY (SELECT * FROM evenement_engagement
               ${filtreEvenements})
         TO STDOUT WITH NULL '\\LA_VALEUR_NULL'`
        )
      )
      const streamCopyFromStdin = this.connexion.client.query(
        copyFrom(
          `COPY evenement_engagement_${mois} FROM STDIN WITH NULL AS '\\LA_VALEUR_NULL'`
        )
      )
      await pipeline(streamCopyToStdout, streamCopyFromStdin)
    } catch (e) {
      erreur = e
    } finally {
      if (this.connexion) await this.connexion.close()
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
}
