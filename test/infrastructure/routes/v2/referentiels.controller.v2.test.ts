import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { GetMotifsSuppressionJeuneV2QueryHandler } from '../../../../src/application/queries/v2/get-motifs-suppression-jeune-v2.query.handler'
import { success } from '../../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../../utils'

describe('ReferentielsController', () => {
  let getMotifsSuppressionV2QueryHandler: StubbedClass<GetMotifsSuppressionJeuneV2QueryHandler>
  let app: INestApplication

  before(async () => {
    getMotifsSuppressionV2QueryHandler = stubClass(
      GetMotifsSuppressionJeuneV2QueryHandler
    )
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetMotifsSuppressionJeuneV2QueryHandler)
      .useValue(getMotifsSuppressionV2QueryHandler)
      .compile()
    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /v2/referentiels/motifs-suppression-jeune', () => {
    it("renvoie les motifs de suppression d'un compte jeune", () => {
      // Given
      getMotifsSuppressionV2QueryHandler.execute.resolves(success([]))

      // When - Then
      return request(app.getHttpServer())
        .get('/v2/referentiels/motifs-suppression-jeune')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
    })
  })
})
