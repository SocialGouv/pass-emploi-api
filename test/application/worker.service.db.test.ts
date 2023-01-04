import { WorkerService } from '../../src/application/worker.service.db'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../src/domain/planificateur'
import { PlanificateurRedisRepository } from '../../src/infrastructure/repositories/planificateur-redis.repository.db'
import { expect, stubClass } from '../utils'
import { INestApplication } from '@nestjs/common'
import { HandleJobFakeCommandHandler } from '../../src/application/commands/jobs/handle-job-fake.command'
import { ConfigService } from '@nestjs/config'
import {
  buildTestingModuleForEndToEndTesting,
  testConfig
} from '../utils/module-for-testing'
import { FirebaseClient } from '../../src/infrastructure/clients/firebase-client'
import { FakeFirebaseClient } from '../infrastructure/repositories/fakes/fake-firebase-client'
import { DatabaseForTesting, getDatabase } from '../utils/database-for-testing'

describe('WorkerService', () => {
  let database: DatabaseForTesting

  before(() => {
    database = getDatabase()
  })
  let app: INestApplication
  let handleJobFakeCommandHandler: HandleJobFakeCommandHandler
  let planificateurRepository: PlanificateurRedisRepository
  let workerService: WorkerService
  beforeEach(async () => {
    await database.cleanRedis()
    handleJobFakeCommandHandler = stubClass(HandleJobFakeCommandHandler)

    const testingModule = await buildTestingModuleForEndToEndTesting()
      .overrideProvider(ConfigService)
      .useValue(testConfig())
      .overrideProvider(HandleJobFakeCommandHandler)
      .useValue(handleJobFakeCommandHandler)
      .overrideProvider(FirebaseClient)
      .useClass(FakeFirebaseClient)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
    planificateurRepository = app.get(PlanificateurRepositoryToken)
    workerService = app.get(WorkerService)
  })

  afterEach(async () => {
    await app.close()
  })
  describe('handler', () => {
    beforeEach(async () => {
      // Given

      await planificateurRepository.isQueueReady()

      workerService.subscribe()

      // When
      const job: Planificateur.Job = {
        dateExecution: new Date(),
        type: Planificateur.JobType.FAKE,
        contenu: { message: 'my test dummy job' }
      }
      await planificateurRepository.creerJob(job)
    })

    it('exécute la commande idoine', done => {
      // Then
      setTimeout(() => {
        expect(handleJobFakeCommandHandler.execute).to.have.been.calledWith()
        done()
      }, 1500)
    })
  })
})
