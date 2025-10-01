import { Sequelize } from 'sequelize-typescript'
import { sqlModels } from '../../src/infrastructure/sequelize/models'
import { createClient } from 'redis'
import { testConfig } from './module-for-testing'
import { RedisClientType as _RedisClientType } from '@redis/client/dist/lib/client'

export let databaseForTesting: DatabaseForTesting | undefined

export class DatabaseForTesting {
  sequelize!: Sequelize
  redisClient: _RedisClientType

  constructor() {
    const { host, port, database, user, password } =
      testConfig().get('database')
    this.sequelize = new Sequelize({
      host: host as string,
      port: parseInt(port as string),
      username: user as string,
      password: password as string,
      database: database as string,
      dialect: 'postgres',
      logging: false
    })
    this.sequelize.addModels(sqlModels)

    const redisUrl = testConfig().get('redis').url
    this.redisClient = createClient({
      url: redisUrl
    })
  }

  cleanPG = async (): Promise<void> => {
    await this.sequelize.truncate({ cascade: true })
  }

  cleanRedis = async (): Promise<void> => {
    await this.redisClient.connect()
    await this.redisClient.flushAll()
    await this.redisClient.disconnect()
  }
}

export function getDatabase(): DatabaseForTesting {
  if (!databaseForTesting) {
    databaseForTesting = new DatabaseForTesting()
  }
  return databaseForTesting
}

databaseForTesting = getDatabase()

// eslint-disable-next-line no-console
console.log('Setting up database for testing')
