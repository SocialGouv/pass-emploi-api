import { Duration } from 'luxon'
import { createClient } from 'redis'
import {
  PlanificateurRedisRepository,
  REDIS_QUEUE_NAME
} from 'src/infrastructure/repositories/planificateur-redis.repository.db'
import { Planificateur } from '../../../src/domain/planificateur'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { expect, stubClass } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import { RedisClient } from '../../utils/types'
import { getDatabase } from '../../utils/database-for-testing'
import JobFake = Planificateur.JobFake

describe('PlanificateurRedisRepository', () => {
  let planificateurRedisRepository: PlanificateurRedisRepository
  let redisClient: RedisClient
  const maintenant = uneDatetime()
  const dateService = stubClass(DateService)

  beforeEach(async () => {
    await getDatabase().cleanRedis()
    const redisUrl = testConfig().get('redis').url
    redisClient = createClient({
      url: redisUrl
    })
    await redisClient.connect()
    dateService.now.returns(maintenant)

    planificateurRedisRepository = new PlanificateurRedisRepository(
      testConfig(),
      dateService
    )
    await planificateurRedisRepository.isQueueReady()
  })

  afterEach(async () => {
    await redisClient.disconnect()
  })

  after(async () => {
    await planificateurRedisRepository.disconnect()
  })

  describe('createJob', () => {
    describe('si le redis est accessible', () => {
      it('créée un job', async () => {
        // Given
        const job: Planificateur.Job<Planificateur.JobRendezVous> = {
          dateExecution: maintenant.plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }

        // When
        await planificateurRedisRepository.ajouterJob(job)

        // Then
        const redisJob = await redisClient.hGetAll(`bull:${REDIS_QUEUE_NAME}:1`)
        expect(
          Duration.fromMillis(parseInt(redisJob.delay)).as('day')
        ).to.equal(2)
      })
      it('créée un job avec id custom', async () => {
        // Given
        const job: Planificateur.Job<Planificateur.JobRendezVous> = {
          dateExecution: maintenant.plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        const idJob = 'test'

        // When
        await planificateurRedisRepository.ajouterJob(job, idJob)

        // Then
        const redisJob = await redisClient.hGetAll(
          `bull:${REDIS_QUEUE_NAME}:${idJob}`
        )
        expect(
          Duration.fromMillis(parseInt(redisJob.delay)).as('day')
        ).to.equal(2)
      })
    })
  })

  describe('supprimerTousLesJobs', () => {
    describe('si le redis est accessible', () => {
      it('supprime les jobs', async () => {
        // Given
        const job: Planificateur.Job<Planificateur.JobRendezVous> = {
          dateExecution: maintenant.plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        await planificateurRedisRepository.ajouterJob(job)

        // When
        await planificateurRedisRepository.supprimerLesJobs()

        // Then
        const redisJob = await redisClient.hGetAll(`bull:${REDIS_QUEUE_NAME}:1`)
        expect(redisJob).to.deep.equal({})
      })
    })
  })

  describe('supprimerJobsSelonPattern', () => {
    describe('si le redis est accessible', () => {
      it('supprime les jobs avec id', async () => {
        // Given
        const job: Planificateur.Job<Planificateur.JobRendezVous> = {
          dateExecution: maintenant.plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        const idJob = 'test'
        await planificateurRedisRepository.ajouterJob(job, idJob)

        // When
        await planificateurRedisRepository.supprimerLesJobsSelonPattern(idJob)

        // Then
        const redisJob = await redisClient.hGetAll(
          `bull:${REDIS_QUEUE_NAME}:${idJob}`
        )
        expect(redisJob).to.deep.equal({})
      })
    })
  })

  describe('createCron', () => {
    describe('si le redis est accessible', () => {
      it('créée un cron', async () => {
        // Given
        const cron: Planificateur.CronJob = {
          type: Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI,
          expression: '* * * * *'
        }

        // When
        await planificateurRedisRepository.ajouterCronJob(cron)

        // Then
        const crons =
          await planificateurRedisRepository.queue.getRepeatableJobs()
        expect(crons.length).to.equal(1)
        expect(crons[0].id).to.equal(cron.type)
        expect(crons[0].cron).to.equal(cron.expression)
      })
    })
  })

  describe('supprimerLesCrons', () => {
    describe('si le redis est accessible', () => {
      it('supprime les crons', async () => {
        // Given
        const cron: Planificateur.CronJob = {
          type: Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI,
          expression: '* * * * *'
        }
        await planificateurRedisRepository.ajouterCronJob(cron)

        // When
        await planificateurRedisRepository.supprimerLesCronJobs()

        // Then
        const crons =
          await planificateurRedisRepository.queue.getRepeatableJobs()
        expect(crons.length).to.equal(0)
      })
    })
  })

  describe('estEnCoursDeTraitement', () => {
    describe('si le redis est accessible', () => {
      it('retourne true uniquement si un job de même type existe en statut active', async () => {
        // Given
        const queue = planificateurRedisRepository.getQueue()
        await queue.pause()
        const jobType = Planificateur.JobType.NOTIFIER_BENEFICIAIRES
        const jobTypeError = Planificateur.JobType.RENDEZVOUS
        const delayedJob: Planificateur.Job<JobFake> = {
          dateExecution: maintenant.plus({ minute: 10 }).toJSDate(),
          type: jobType,
          contenu: { message: 'delayed' }
        }
        const job: Planificateur.Job = {
          dateExecution: maintenant.toJSDate(),
          type: jobType,
          contenu: { message: 'job' }
        }
        const jobError: Planificateur.Job = {
          dateExecution: maintenant.toJSDate(),
          type: jobTypeError,
          contenu: { message: 'jobError' }
        }
        await planificateurRedisRepository.ajouterJob(delayedJob, 'delayedJob')
        await planificateurRedisRepository.ajouterJob(job, 'job')
        await planificateurRedisRepository.ajouterJob(jobError, 'jobError')

        const delayedJobFromQueue = await queue.getJob('delayedJob')
        const jobFromQueue = await queue.getJob('job')
        const jobErrorFromQueue = await queue.getJob('jobError')

        // Testing delayed, paused
        expect(await delayedJobFromQueue?.getState()).to.equal('delayed')
        expect(await jobFromQueue?.getState()).to.equal('paused')

        // When Then
        expect(
          await planificateurRedisRepository.estEnCoursDeTraitement(jobType)
        ).to.equal(false)

        // Given - Testing waiting
        await queue.resume()
        expect(await delayedJobFromQueue?.getState()).to.equal('delayed')
        expect(await jobFromQueue?.getState()).to.equal('waiting')

        // When Then
        expect(
          await planificateurRedisRepository.estEnCoursDeTraitement(jobType)
        ).to.equal(false)

        // Given - Testing active
        await queue.getNextJob()
        expect(await delayedJobFromQueue?.getState()).to.equal('delayed')
        expect(await jobFromQueue?.getState()).to.equal('active')

        // When Then
        expect(
          await planificateurRedisRepository.estEnCoursDeTraitement(jobType)
        ).to.equal(true)

        // Given - Testing completed
        await jobFromQueue?.moveToCompleted('result', true)
        expect(await delayedJobFromQueue?.getState()).to.equal('delayed')
        expect(await jobFromQueue?.getState()).to.equal('completed')

        // When Then
        expect(
          await planificateurRedisRepository.estEnCoursDeTraitement(jobType)
        ).to.equal(false)

        // Given - Testing failed
        await queue.getNextJob()
        await jobErrorFromQueue?.moveToFailed({ message: 'error' }, true)
        expect(await jobErrorFromQueue?.getState()).to.equal('failed')

        // When Then
        expect(
          await planificateurRedisRepository.estEnCoursDeTraitement(
            jobTypeError
          )
        ).to.equal(false)
      })

      it('retourne false si un job de type différent existe en statut active', async () => {
        // Given
        const queue = planificateurRedisRepository.getQueue()
        await planificateurRedisRepository.ajouterJob(
          {
            dateExecution: maintenant.toJSDate(),
            type: Planificateur.JobType.NETTOYER_LES_JOBS,
            contenu: { message: 'job' }
          },
          'job'
        )
        const job = await queue.getJob('job')
        await queue.getNextJob()
        expect(await job?.getState()).to.equal('active')

        // When Then
        expect(
          await planificateurRedisRepository.estEnCoursDeTraitement(
            Planificateur.JobType.MAJ_SEGMENTS
          )
        ).to.equal(false)
      })
    })
  })

  describe('aUnJobNonTermine', () => {
    describe('si le redis est accessible', () => {
      it('retourne true uniquement si un job de même type existe en statut wait, delayed, paused ou active', async () => {
        // Given
        const queue = planificateurRedisRepository.getQueue()
        await queue.pause()
        const jobTypeDelayed = Planificateur.JobType.NOTIFIER_BENEFICIAIRES
        const jobType = Planificateur.JobType.RENDEZVOUS
        const delayedJob: Planificateur.Job<JobFake> = {
          dateExecution: maintenant.plus({ minute: 10 }).toJSDate(),
          type: jobTypeDelayed,
          contenu: { message: 'delayed' }
        }
        const job: Planificateur.Job = {
          dateExecution: maintenant.toJSDate(),
          type: jobType,
          contenu: { message: 'job' }
        }
        const jobError: Planificateur.Job = {
          dateExecution: maintenant.toJSDate(),
          type: jobType,
          contenu: { message: 'jobError' }
        }
        await planificateurRedisRepository.ajouterJob(delayedJob, 'delayedJob')
        await planificateurRedisRepository.ajouterJob(job, 'job')
        await planificateurRedisRepository.ajouterJob(jobError, 'jobError')

        const delayedJobFromQueue = await queue.getJob('delayedJob')
        const jobFromQueue = await queue.getJob('job')
        const jobErrorFromQueue = await queue.getJob('jobError')

        // Testing delayed, paused
        expect(await delayedJobFromQueue?.getState()).to.equal('delayed')
        expect(await jobFromQueue?.getState()).to.equal('paused')
        expect(await jobErrorFromQueue?.getState()).to.equal('paused')

        // When Then
        expect(
          await planificateurRedisRepository.aUnJobNonTermine(jobTypeDelayed)
        ).to.equal(true)
        expect(
          await planificateurRedisRepository.aUnJobNonTermine(jobType)
        ).to.equal(true)

        // Given - Testing waiting
        await queue.resume()
        expect(await jobFromQueue?.getState()).to.equal('waiting')
        expect(await jobErrorFromQueue?.getState()).to.equal('waiting')

        // When Then
        expect(
          await planificateurRedisRepository.aUnJobNonTermine(jobType)
        ).to.equal(true)

        // Given - Testing active
        await queue.getNextJob()
        expect(await jobFromQueue?.getState()).to.equal('active')
        expect(await jobErrorFromQueue?.getState()).to.equal('waiting')

        // When Then
        expect(
          await planificateurRedisRepository.aUnJobNonTermine(jobType)
        ).to.equal(true)

        // Given - Testing completed, failed
        await jobFromQueue?.moveToCompleted('result', true)
        await queue.getNextJob() // jobError = active
        await jobErrorFromQueue?.moveToFailed({ message: 'error' }, true)
        expect(await jobFromQueue?.getState()).to.equal('completed')
        expect(await jobErrorFromQueue?.getState()).to.equal('failed')

        // When Then
        expect(
          await planificateurRedisRepository.aUnJobNonTermine(jobType)
        ).to.equal(false)
      })

      it('retourne false si un job de type différent existe en statut non terminé', async () => {
        // Given
        const queue = planificateurRedisRepository.getQueue()
        await planificateurRedisRepository.ajouterJob(
          {
            dateExecution: maintenant.toJSDate(),
            type: Planificateur.JobType.NETTOYER_LES_JOBS,
            contenu: { message: 'job' }
          },
          'job'
        )
        const job = await queue.getJob('job')
        await queue.getNextJob()
        expect(await job?.getState()).to.equal('active')

        // When Then
        expect(
          await planificateurRedisRepository.aUnJobNonTermine(
            Planificateur.JobType.MAJ_SEGMENTS
          )
        ).to.equal(false)
      })
    })
  })
})
