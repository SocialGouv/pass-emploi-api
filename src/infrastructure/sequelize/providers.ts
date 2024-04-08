import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Sequelize } from 'sequelize-typescript'
import { buildError } from '../../utils/logger.module'
import { sqlModels } from './models'

export const SequelizeInjectionToken = 'SEQUELIZE'

export const databaseProviders = [
  {
    provide: SequelizeInjectionToken,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<Sequelize> => {
      let otherOptions = {}
      if (configService.get('environment') === 'staging') {
        otherOptions = {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        }
      }

      const sequelize = new Sequelize({
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        dialect: 'postgres',
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        benchmark: configService.get<string>('logLevel') === 'trace',
        logging: false,
        pool: {
          max: configService.get<number>('database.maxConnections'),
          min: configService.get<number>('database.minConnections'),
          acquire: configService.get<number>('database.acquireConnections'),
          idle: configService.get<number>('database.idleConnections'),
          evict: configService.get<number>('database.evictConnections')
        },
        ...otherOptions
      })
      sequelize.addModels(sqlModels)
      const logger = new Logger('Sequelize')
      try {
        logger.log('Connecting to PostgreSQL database')
        await sequelize.authenticate()
        logger.log('Connection with the PostgreSQL database is OK')
        return sequelize
      } catch (e) {
        logger.error(
          buildError('Error connecting to the PostgreSQL database', e)
        )
        throw e
      }
    }
  }
]
