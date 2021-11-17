import { parse } from 'pg-connection-string'
import { Sequelize } from 'sequelize-typescript'
import { sqlModels } from '../../src/infrastructure/sequelize/models'

export class DatabaseForTesting {
  sequelize!: Sequelize

  constructor () {
    // eslint-disable-next-line no-process-env,@typescript-eslint/no-non-null-assertion
    const { host, port, database, user, password } = parse(process.env.DATABASE_URL!)
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

    beforeEach(async () => {
      await this.sequelize.truncate({ cascade: true })
    })

    after(async () => {
      await this.sequelize.close()
    })
  }

  static prepare (): DatabaseForTesting {
    return new DatabaseForTesting()
  }
}
