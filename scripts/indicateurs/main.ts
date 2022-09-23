import { getCommits, getEnviroment, getTags, log } from './utils'

import { Calendar } from './calendar'
import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({
  path: './indicateurs/.environment'
})

async function main(): Promise<void> {
  const tags = await getTags()
  const commits = await getCommits()
  const calendar = new Calendar(commits, tags)

  const indicateurs = {
    deploymentFrequency: calendar.getNumberOfDeploymentPerWeek(),
    leadTime: calendar.getLeadTimeToProduction()
  }

  const databaseUrl = getEnviroment('DATABASE_URL')
  const databaseName = getEnviroment('DATABASE_NAME')

  const client = new MongoClient(databaseUrl, {
    ssl: false,
    sslValidate: false,
    tls: false,
    directConnection: true
  })
  log('connecting to mongodb')
  await client.connect()
  log('connected to mongodb')
  log('inserting indicateurs')
  await client.db().collection('indicateurs').deleteMany({
    type: 'leadTime'
  })
  for (const week of indicateurs.leadTime) {
    await client.db(databaseName).collection('indicateurs').insertOne({
      type: 'leadTime',
      date: week.date,
      value: week.value
    })
  }

  await client.db().collection('indicateurs').deleteMany({
    type: 'deploymentFrequency'
  })
  for (const week of indicateurs.deploymentFrequency) {
    await client.db(databaseName).collection('indicateurs').insertOne({
      type: 'deploymentFrequency',
      date: week.date,
      value: week.value
    })
  }
  log('indicateurs inserted')
  process.exit(0)
}

main()
