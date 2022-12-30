import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Bull, * as QueueBull from 'bull'
import { DateTime } from 'luxon'
import { Planificateur } from '../../domain/planificateur'
import { NettoyageJobsStats } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'
import { buildError } from '../../utils/logger.module'

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

  async creerJob<T>(
    job: Planificateur.Job<T>,
    jobId?: string,
    params?: Planificateur.JobParams
  ): Promise<void> {
    if (this.isReady) {
      const now = this.dateService.now()
      const delay = DateTime.fromJSDate(job.dateExecution).diff(
        now
      ).milliseconds
      const jobOptions: Bull.JobOptions = {
        jobId: jobId,
        delay: delay,
        attempts: params?.attempts || 1,
        backoff: params?.backoff?.delay || 0,
        priority: params?.priority || 0
      }
      await this.queue.add(job, jobOptions)
    } else {
      throw new Error('Redis not ready to accept connection')
    }
  }

  async supprimerLesJobs(): Promise<void> {
    await this.queue.removeJobs('*')
  }

  async subscribe(handle: Planificateur.Handler<unknown>): Promise<void> {
    this.queue.process(async jobRedis => {
      this.logger.log(
        `Execution du job ${jobRedis.id} de type ${jobRedis.data.type}`
      )
      const job: Planificateur.Job<Planificateur.ContenuJob> = {
        dateExecution: jobRedis.data.date,
        type: jobRedis.data.type,
        contenu: jobRedis.data.contenu
      }
      return handle(job)
    })
  }

  async isQueueReady(): Promise<Bull.Queue> {
    return this.queue.isReady()
  }

  async disconnect(): Promise<void> {
    await this.queue.close()
  }

  async creerCronJob(cron: Planificateur.CronJob): Promise<void> {
    await this.queue.add(cron, {
      jobId: cron.type,
      repeat: {
        cron: cron.expression,
        tz: CRON_TIMEZONE,
        startDate: cron.dateDebutExecution
      }
    })
  }

  async supprimerLesCronJobs(): Promise<void> {
    const repeatableJobs = await this.queue.getRepeatableJobs()
    for (const job of repeatableJobs) {
      await this.queue.removeRepeatable({
        cron: job.cron,
        tz: job.tz,
        jobId: job.id
      })
    }
  }

  async supprimerLesJobsPasses(): Promise<NettoyageJobsStats> {
    const stats: NettoyageJobsStats = {
      listeJobsNettoyes: [],
      nbJobsNettoyes: 0,
      listeErreurs: [],
      nbErreurs: 0
    }
    const ilYA7Jours = this.dateService.now().minus({ day: 7 }).toMillis()
    const jobs = await this.queue.getCompleted()
    for (const job of jobs) {
      if (job.timestamp < ilYA7Jours) {
        try {
          await this.queue.removeJobs(job.id.toString())
          stats.listeJobsNettoyes.push({
            id: job.id.toString(),
            type: job.data.type
          })
          stats.nbJobsNettoyes++
        } catch (e) {
          this.logger.error(
            buildError(
              `Erreur lors de la suppression du job de type ${job.data.type} et d'id ${job.id}`,
              e
            )
          )
          stats.listeErreurs.push({
            id: job.id.toString(),
            type: job.data.type
          })
          stats.nbErreurs++
        }
      }
    }
    return stats
  }

  async supprimerLesJobsSelonPattern(pattern: string): Promise<void> {
    await this.queue.removeJobs(`*${pattern}*`)
  }

  async estEnCours(jobType: Planificateur.JobType): Promise<boolean> {
    const activeJobs = await this.queue.getActive()
    return activeJobs.filter(job => job.data.type === jobType).length > 1
  }
}
