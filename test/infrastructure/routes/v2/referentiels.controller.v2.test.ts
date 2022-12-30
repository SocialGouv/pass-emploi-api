import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { GetMotifsSuppressionJeuneV2QueryHandler } from '../../../../src/application/queries/v2/get-motifs-suppression-jeune-v2.query.handler'
import { success } from '../../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../../fixtures/authentification.fixture'
import { StubbedClass } from '../../../utils'
import { getApplicationWithStubbedDependencies } from '../../../utils/module-for-testing'

describe('ReferentielsController', () => {
  let getMotifsSuppressionV2QueryHandler: StubbedClass<GetMotifsSuppressionJeuneV2QueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getMotifsSuppressionV2QueryHandler = app.get(
      GetMotifsSuppressionJeuneV2QueryHandler
    )
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
