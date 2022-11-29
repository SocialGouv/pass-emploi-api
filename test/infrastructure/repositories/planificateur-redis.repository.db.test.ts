import { Duration } from 'luxon'
import { createClient } from 'redis'
import { PlanificateurRedisRepository } from 'src/infrastructure/repositories/planificateur-redis.repository.db'
import { Planificateur } from '../../../src/domain/planificateur'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { expect, stubClass } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import { RedisClient } from '../../utils/types'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('PlanificateurRedisRepository', () => {
  DatabaseForTesting.prepare()
  let planificateurRedisRepository: PlanificateurRedisRepository
  let redisClient: RedisClient

  beforeEach(async () => {
    const redisUrl = testConfig().get('redis').url
    redisClient = createClient({
      url: redisUrl
    })
    await redisClient.connect()
    const dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

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
          dateExecution: uneDatetime().plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }

        // When
        await planificateurRedisRepository.creerJob(job)

        // Then
        const redisJob = await redisClient.hGetAll('bull:JobQueue:1')
        expect(
          Duration.fromMillis(parseInt(redisJob.delay)).as('day')
        ).to.equal(2)
      })
      it('créée un job avec id custom', async () => {
        // Given
        const job: Planificateur.Job<Planificateur.JobRendezVous> = {
          dateExecution: uneDatetime().plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        const idJob = 'test'

        // When
        await planificateurRedisRepository.creerJob(job, idJob)

        // Then
        const redisJob = await redisClient.hGetAll(`bull:JobQueue:${idJob}`)
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
          dateExecution: uneDatetime().plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        await planificateurRedisRepository.creerJob(job)

        // When
        await planificateurRedisRepository.supprimerLesJobs()

        // Then
        const redisJob = await redisClient.hGetAll('bull:JobQueue:1')
        expect(redisJob).to.deep.equal({})
      })
    })
  })

  describe('supprimerJobsSelonPattern', () => {
    describe('si le redis est accessible', () => {
      it('supprime les jobs avec id', async () => {
        // Given
        const job: Planificateur.Job<Planificateur.JobRendezVous> = {
          dateExecution: uneDatetime().plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobType.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        const idJob = 'test'
        await planificateurRedisRepository.creerJob(job, idJob)

        // When
        await planificateurRedisRepository.supprimerLesJobsSelonPattern(idJob)

        // Then
        const redisJob = await redisClient.hGetAll(`bull:JobQueue:${idJob}`)
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
        await planificateurRedisRepository.creerCronJob(cron)

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
        await planificateurRedisRepository.creerCronJob(cron)

        // When
        await planificateurRedisRepository.supprimerLesCronJobs()

        // Then
        const crons =
          await planificateurRedisRepository.queue.getRepeatableJobs()
        expect(crons.length).to.equal(0)
      })
    })
  })
})
