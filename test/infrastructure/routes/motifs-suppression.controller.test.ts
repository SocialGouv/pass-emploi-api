import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'

import { GetMotifsSuppressionJeuneQueryHandler } from '../../../src/application/queries/get-motifs-suppression-jeune-query-handler'

let getMotifsSuppressionCommandHandler: StubbedClass<GetMotifsSuppressionJeuneQueryHandler>

describe('MotifsSuppressionController', () => {
  getMotifsSuppressionCommandHandler = stubClass(
    GetMotifsSuppressionJeuneQueryHandler
  )
  let app: INestApplication

  before(async () => {
    getMotifsSuppressionCommandHandler = stubClass(
      GetMotifsSuppressionJeuneQueryHandler
    )
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetMotifsSuppressionJeuneQueryHandler)
      .useValue(GetMotifsSuppressionJeuneQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /referentiels/motifs-suppression', () => {
    it('renvoie les motifs de suppression', () => {
      // Given
      getMotifsSuppressionCommandHandler.execute.resolves()

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/motifs-suppression')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
    })
  })
})
