import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Bull, * as QueueBull from 'bull'
import { DateTime, Duration } from 'luxon'
import { Planificateur } from '../../domain/planificateur'
import { NettoyageJobsStats } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'
import { NonTrouveError } from '../../building-blocks/types/domain-error'

const CRON_TIMEZONE = 'Europe/Paris'
export const REDIS_QUEUE_NAME = 'JobQueue'

const MAX_NUMBER_REDIS_JOBS = 50

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
      REDIS_QUEUE_NAME,
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

  async ajouterJob<T>(
    job: Planificateur.Job<T>,
    jobId?: string,
    params?: Planificateur.JobParams
  ): Promise<string> {
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
      const bullJob = await this.queue.add(job, jobOptions)
      return String(bullJob.id)
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

  getQueue(): Bull.Queue {
    return this.queue
  }

  async disconnect(): Promise<void> {
    await this.queue.close()
  }

  async ajouterCronJob(cron: Planificateur.CronJob): Promise<void> {
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
      nbJobsNettoyes: 0
    }
    const ilYA7Jours = Duration.fromObject({ day: 7 }).toMillis()
    const jobs = await this.queue.clean(ilYA7Jours, 'completed')
    stats.nbJobsNettoyes = jobs.length
    return stats
  }

  async supprimerLesJobsSelonPattern(pattern: string): Promise<void> {
    await this.queue.removeJobs(`*${pattern}*`)
  }

  async estEnCoursDeTraitement(
    jobType: Planificateur.JobType
  ): Promise<boolean> {
    const activeJobs = await this.queue.getActive(0, MAX_NUMBER_REDIS_JOBS)
    return activeJobs.some(job => job.data.type === jobType)
  }

  async existePlusQuUnJobActifDeCeType(
    jobType: Planificateur.JobType
  ): Promise<boolean> {
    const activeJobs = await this.queue.getActive(0, MAX_NUMBER_REDIS_JOBS)
    return activeJobs.filter(job => job.data.type === jobType).length > 1
  }

  async recupererPremierJobNonTermine(
    jobType: Planificateur.JobType
  ): Promise<string | null> {
    const jobsNonTermines = await this.recupererJobsNonTermines()
    const job = jobsNonTermines?.find(job => job?.data?.type === jobType)
    if (!job || !job.id) return null
    return String(job.id)
  }

  async recupererJobsNonTerminesParType(
    jobType: Planificateur.JobType
  ): Promise<Bull.Job[]> {
    return (await this.recupererJobsNonTermines()).filter(
      job => job.data.type === jobType
    )
  }

  async getJobInformations(jobId: Planificateur.JobId): Promise<Bull.Job> {
    const job = await this.queue.getJob(jobId.jobId)
    if (!job) throw new NonTrouveError('Job', jobId.jobId)
    return job
  }

  private async recupererJobsNonTermines(): Promise<Bull.Job[]> {
    return await this.queue.getJobs(
      ['active', 'delayed', 'waiting', 'paused'],
      0,
      MAX_NUMBER_REDIS_JOBS
    )
  }
}
