import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Bull, * as QueueBull from 'bull'
import { DateTime } from 'luxon'
import { Planificateur } from '../../domain/planificateur'
import { DateService } from '../../utils/date-service'

const CRON_TIMEZONE = 'Europe/Paris'

@Injectable()
export class PlanificateurRedisRepository implements Planificateur.Repository {
  queue: Bull.Queue
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
          enableReadyCheck: false,
          maxRetriesPerRequest: null,
          retryStrategy: (times: number): number => {
            if (times > 1) {
              this.logger.error(
                'could not connect to redis!' + times.toString()
              )
            }
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

  async createJob<T>(job: Planificateur.Job<T>, jobId?: string): Promise<void> {
    if (this.isReady) {
      const now = this.dateService.now()
      const delay = DateTime.fromJSDate(job.date).diff(now).milliseconds
      await this.queue.add(job, { delay, jobId })
    } else {
      throw new Error('Redis not ready to accept connection')
    }
  }

  async supprimerTousLesJobs(): Promise<void> {
    await this.queue.removeJobs('*')
  }

  async subscribe(handle: Planificateur.Handler<unknown>): Promise<void> {
    this.queue.process(async jobRedis => {
      this.logger.log(
        `Execution du job ${jobRedis.id} de type ${jobRedis.data.type}`
      )
      const job: Planificateur.Job<Planificateur.JobType> = {
        date: jobRedis.data.date,
        type: jobRedis.data.type,
        contenu: jobRedis.data.contenu
      }
      await handle(job)
    })
  }

  async isQueueReady(): Promise<Bull.Queue> {
    return this.queue.isReady()
  }

  async disconnect(): Promise<void> {
    await this.queue.close()
  }

  async createCron(cron: Planificateur.Cron): Promise<void> {
    await this.queue.add(cron, {
      jobId: cron.type,
      repeat: { cron: cron.expression, tz: CRON_TIMEZONE }
    })
  }

  async supprimerLesCrons(): Promise<void> {
    const repeatableJobs = await this.queue.getRepeatableJobs()
    for (const job of repeatableJobs) {
      await this.queue.removeRepeatable({
        cron: job.cron,
        tz: job.tz,
        jobId: job.id
      })
    }
  }

  async supprimerLesAnciensJobs(): Promise<void> {
    const ilYA7Jours = this.dateService.now().minus({ day: 7 }).toMillis()
    const jobs = await this.queue.getCompleted()
    for (const job of jobs) {
      if (job.timestamp < ilYA7Jours) {
        await this.queue.removeJobs(job.id.toString())
      }
    }
  }

  async supprimerJobsSelonPattern(pattern: string): Promise<void> {
    await this.queue.removeJobs(`*${pattern}*`)
  }
}
