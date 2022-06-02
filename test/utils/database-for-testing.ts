import { parse } from 'pg-connection-string'
import { Sequelize } from 'sequelize-typescript'
import { sqlModels } from '../../src/infrastructure/sequelize/models'
import { createClient } from 'redis'
import { testConfig } from './module-for-testing'

export class DatabaseForTesting {
  sequelize!: Sequelize

  constructor() {
    const { host, port, database, user, password } = parse(
      // eslint-disable-next-line no-process-env,@typescript-eslint/no-non-null-assertion
      process.env.DATABASE_URL || 'postgresql://test:test@localhost:56432/test'
    )
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
    const redisClient = createClient({
      url: redisUrl
    })
    beforeEach(async () => {
      await this.sequelize.truncate({ cascade: true })
      await redisClient.connect()
      await redisClient.flushAll()
      await redisClient.disconnect()
    })

    after(async () => {
      await this.sequelize.close()
    })
  }

  static prepare(): DatabaseForTesting {
    return new DatabaseForTesting()
  }
}

export const databaseForTesting = DatabaseForTesting.prepare()
