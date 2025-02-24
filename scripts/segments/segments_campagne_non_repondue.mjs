/* eslint-disable no-console */
import Pg from 'pg'
import pgc from 'pg-connection-string'
import * as dotenv from 'dotenv'
import { BigQuery } from '@google-cloud/bigquery'
import fs from 'fs'

const { parse } = pgc

dotenv.config()
const now = new Date()
const membershipsFile = 'segments/memberships.json'
const metadataFile = 'segments/metadata.json'
const datasetId = 'firebase_imported_segments'
const NEW_LINE = '\n'

const bigqueryClient = getBigQueryClient()
const pgClient = getPgClient()
pgClient.connect()
const jeunes = await fetchJeunesInstanceIdNayantPasReponduAUneCampagneActive(
  pgClient
)
pgClient.end()

const membershipsWriteStream = fs.createWriteStream(membershipsFile)

jeunes.rows.forEach(jeune => {
  const segment = buildSegmentCampagneNonRepondue(jeune, now)
  membershipsWriteStream.write(JSON.stringify(segment) + NEW_LINE)
})
membershipsWriteStream.end()

await loadData(bigqueryClient, datasetId, 'SegmentMetadata', metadataFile)
await loadData(bigqueryClient, datasetId, 'SegmentMemberships', membershipsFile)

async function fetchJeunesInstanceIdNayantPasReponduAUneCampagneActive(
  pgClient
) {
  const sql = `select instance_id, structure
                 from jeune
                 where instance_id is not null
                   and id not in (select id_jeune
                                  from reponse_campagne
                                  where id_campagne in
                                        (select id from campagne where date_debut < now() and date_fin > now()))`
  return await pgClient.query(sql)
}

async function loadData(bigqueryClient, datasetId, tableId, file) {
  let options = {
    autodetect: true,
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    writeDisposition: 'WRITE_TRUNCATE'
  }
  const bigQueryJob = await bigqueryClient
    .dataset(datasetId)
    .table(tableId)
    .load(file, options)
  console.log(bigQueryJob[0].status)
}

function getBigQueryClient() {
  return new BigQuery({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  })
}

function getPgClient() {
  const DATABASE_URL = process.env.DATABASE_URL
  const databaseConfiguration = parse(DATABASE_URL)
  return new Pg.Client(databaseConfiguration)
}

function buildSegmentCampagneNonRepondue(jeune, now) {
  const segment =
    jeune.structure === 'POLE_EMPLOI'
      ? 'CAMPAGNE_NON_REPONDUE_PE'
      : 'CAMPAGNE_NON_REPONDUE_MILO'
  return {
    instance_id: jeune.instance_id,
    update_time: now,
    segment_labels: [segment]
  }
}
