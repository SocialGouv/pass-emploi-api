import { pipeline } from 'node:stream/promises'
import { PoolClient } from 'pg'
import { from as copyFrom, to as copyTo } from 'pg-copy-streams'
import * as dotenv from 'dotenv'
import { getConnexionToDBTarget } from '../../src/infrastructure/sequelize/connector-analytics'

dotenv.config({ path: '.environment' })

async function run(): Promise<void> {
  const connexionTarget = await getConnexionToDBTarget()
  try {
    await creerUneTableAnnuelle(connexionTarget.client, '2022')
    await indexerLesColonnes(connexionTarget.client, '2022')

    const filtreEvenements = `WHERE date_evenement between '2022'::timestamp and '2023'::timestamp`
    const compteEvenements = await compteEvenementsAnnuels(
      connexionTarget.client,
      filtreEvenements
    )
    await remplirLaTableAnnuelle(
      connexionTarget.client,
      compteEvenements,
      filtreEvenements
    )
  } catch (e) {
    console.error(e)
  } finally {
    await connexionTarget.close()
  }
}

async function creerUneTableAnnuelle(
  clientTarget: PoolClient,
  annee: string
): Promise<void> {
  console.log('Création table annuelle')
  await clientTarget.query(`
      CREATE TABLE IF NOT EXISTS evenement_engagement_${annee} AS
          TABLE evenement_engagement
          WITH NO DATA;`)
}

async function indexerLesColonnes(
  clientTarget: PoolClient,
  annee: string
): Promise<void> {
  console.log(`Indexation des colonnes pour l'année _${annee}`)
  await clientTarget.query(`
      create index if not exists evenement_engagement_date_evenement_index on evenement_engagement_${annee} (date_evenement);
      create index if not exists evenement_engagement_categorie_index on evenement_engagement_${annee} (categorie);
      create index if not exists evenement_engagement_action_index on evenement_engagement_${annee} (action);
      create index if not exists evenement_engagement_nom_index on evenement_engagement_${annee} (nom);
      create index if not exists evenement_engagement_id_utilisateur_index on evenement_engagement_${annee} (id_utilisateur);
      create index if not exists evenement_engagement_type_utilisateur_index on evenement_engagement_${annee} (type_utilisateur);
      create index if not exists evenement_engagement_structure_index on evenement_engagement_${annee} (structure);
      create index if not exists evenement_engagement_code_index on evenement_engagement_${annee} (code);
      create index if not exists evenement_engagement_semaine_index on evenement_engagement_${annee} (semaine);
      create index if not exists evenement_engagement_jour_index on evenement_engagement_${annee} (jour);
      create index if not exists evenement_engagement_agence_index on evenement_engagement_${annee} (agence);
      create index if not exists evenement_engagement_departement_index on evenement_engagement_${annee} (departement);
      create index if not exists evenement_engagement_region_index on evenement_engagement_${annee} (region);
  `)
}

async function compteEvenementsAnnuels(
  clientTarget: PoolClient,
  filtreEvenemnts: string
): Promise<number> {
  console.log('Récupération du nombre d’événements')
  const compteEvenementAnnee = await clientTarget.query(`
      SELECT count(*) as compteannee
      FROM evenement_engagement ${filtreEvenemnts}
  `)
  return Number(compteEvenementAnnee.rows[0].compteannee ?? '0')
}

async function remplirLaTableAnnuelle(
  clientTarget: PoolClient,
  nombreEvenements: number,
  filtreEvenements: string
): Promise<void> {
  console.log('Copie des événements par batch')
  const TAILLE_DU_BATCH = 150000
  const nombreDeBatches = Math.ceil(nombreEvenements / TAILLE_DU_BATCH)

  for (
    let numeroBatchActuel = 0;
    numeroBatchActuel < nombreDeBatches;
    numeroBatchActuel++
  ) {
    console.log(`Batch ${numeroBatchActuel + 1}/${nombreDeBatches}`)
    const streamCopyToStdout = clientTarget.query(
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
        `COPY evenement_engagement_2022 FROM STDIN WITH NULL AS '\\LA_VALEUR_NULL'`
      )
    )
    await pipeline(streamCopyToStdout, streamCopyFromStdin)
  }
}

run()
