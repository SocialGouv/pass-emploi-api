import { Logger } from '@nestjs/common'
import { buildError } from '../../utils/logger.module'
import { parse } from 'pg-connection-string'
import { Sequelize, SequelizeOptions } from 'sequelize-typescript'
import { Pool, PoolClient, PoolConfig } from 'pg'

export async function createSequelizeForAnalytics(): Promise<Sequelize> {
  // eslint-disable-next-line no-process-env
  const databaseUrl = process.env.DUMP_RESTORE_DB_TARGET as string
  const { host, port, database, user, password } = parse(databaseUrl)

  const options: SequelizeOptions = {
    host: host as string,
    port: Number(port),
    dialect: 'postgres',
    username: user as string,
    password: password as string,
    database: database as string,
    logging: false
  }
  // eslint-disable-next-line no-process-env
  if (process.env.ENVIRONMENT === 'staging') {
    options.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
  const sequelize = new Sequelize(options)
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

export async function getConnexionToDBSource(): Promise<PgConnexion> {
  // eslint-disable-next-line no-process-env
  const databaseUrl = process.env.DUMP_RESTORE_DB_SOURCE as string
  return getPGConnexion(databaseUrl)
}

export async function getConnexionToDBTarget(): Promise<PgConnexion> {
  // eslint-disable-next-line no-process-env
  const databaseUrl = process.env.DUMP_RESTORE_DB_TARGET as string
  return getPGConnexion(databaseUrl)
}

async function getPGConnexion(databaseUrl: string): Promise<PgConnexion> {
  const { host, port, database, user, password } = parse(databaseUrl)
  const options: PoolConfig = {
    host: host as string,
    port: Number(port),
    user: user as string,
    password: password as string,
    database: database as string
  }
  // eslint-disable-next-line no-process-env
  if (process.env.ENVIRONMENT === 'staging') {
    options.ssl = true
  }
  const pool = new Pool(options)
  const client = await pool.connect()
  return {
    client,
    close: async (): Promise<void> => {
      client.release()
      await pool.end()
    }
  }
}

interface PgConnexion {
  client: PoolClient
  close: () => Promise<void>
}
