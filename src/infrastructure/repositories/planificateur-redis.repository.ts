import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Bull, * as QueueBull from 'bull'
import { DateTime } from 'luxon'
import { Planificateur } from '../../domain/planificateur'
import { DateService } from '../../utils/date-service'

@Injectable()
export class PlanificateurRedisRepository implements Planificateur.Repository {
  private queue: Bull.Queue
  private isReady = false
  private logger: Logger

  constructor(
    private configService: ConfigService,
    private dateService: DateService
  ) {
    this.logger = new Logger('PlanificateurRedisRepository')
    this.queue = new QueueBull(
      'JobQueue',
      this.configService.get('redis').url,
      {
        redis: {
          commandTimeout: 1000,
          enableOfflineQueue: false,
          enableReadyCheck: true,
          connectTimeout: 1000,
          maxRetriesPerRequest: 2,
          retryStrategy: (times: number): number => {
            this.logger.error('could not connect to redis!' + times.toString())
            this.isReady = true
            return 1000
          }
        }
      }
    )
    this.queue.isReady().then(() => {
      this.isReady = true
    })
  }

  async createJob(job: Planificateur.Job): Promise<void> {
    if (this.isReady) {
      const now = this.dateService.now()
      const delay = DateTime.fromJSDate(job.date).diff(now).milliseconds
      await this.queue.add(job, { delay })
    } else {
      throw new Error('Redis not ready to accept connection')
    }
  }

  async isQueueReady(): Promise<Bull.Queue> {
    return this.queue.isReady()
  }

  async disconnect(): Promise<void> {
    await this.queue.close()
  }
}
