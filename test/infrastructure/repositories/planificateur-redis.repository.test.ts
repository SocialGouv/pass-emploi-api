import { Duration } from 'luxon'
import { createClient } from 'redis'
import { PlanificateurRedisRepository } from 'src/infrastructure/repositories/planificateur-redis.repository'
import { Planificateur } from '../../../src/domain/planificateur'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { DatabaseForTesting, expect, stubClass } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import { RedisClient } from '../../utils/types'

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
    dateService.now.returns(uneDatetime)

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
          date: uneDatetime.plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobEnum.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }

        // When
        await planificateurRedisRepository.createJob(job)

        // Then
        const redisJob = await redisClient.hGetAll('bull:JobQueue:1')
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
          date: uneDatetime.plus({ days: 2 }).toJSDate(),
          type: Planificateur.JobEnum.RENDEZVOUS,
          contenu: {
            idRendezVous: 'id'
          }
        }
        await planificateurRedisRepository.createJob(job)

        // When
        await planificateurRedisRepository.supprimerTousLesJobs()

        // Then
        const redisJob = await redisClient.hGetAll('bull:JobQueue:1')
        expect(redisJob).to.deep.equal({})
      })
    })
  })
})
