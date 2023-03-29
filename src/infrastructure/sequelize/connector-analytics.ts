import { Logger } from '@nestjs/common'
import { buildError } from '../../utils/logger.module'
import { parse } from 'pg-connection-string'
import { Sequelize } from 'sequelize-typescript'

export async function createSequelizeForAnalytics(): Promise<Sequelize> {
  // eslint-disable-next-line no-process-env
  const databaseUrl = process.env.DUMP_RESTORE_DB_TARGET as string
  const { host, port, database, user, password } = parse(databaseUrl)

  const sequelize = new Sequelize({
    host: host as string,
    port: Number(port),
    dialect: 'postgres',
    username: user as string,
    password: password as string,
    database: database as string
  })
  const logger = new Logger('SequelizeAnalytics')
  try {
    logger.log('Connecting to PostgreSQL Analytics database')
    await sequelize.authenticate()
    logger.log('Connection with the PostgreSQL Analytics database is OK')
    return sequelize
  } catch (e) {
    logger.error(
      buildError('Error connecting to the PostgreSQL Analytics database', e)
    )
    throw e
  }
}
