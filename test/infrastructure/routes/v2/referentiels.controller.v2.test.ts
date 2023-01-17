import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { GetMotifsSuppressionJeuneQueryHandler } from '../../../../src/application/queries/get-motifs-suppression-jeune.query.handler'
import { success } from '../../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../../fixtures/authentification.fixture'
import { StubbedClass } from '../../../utils'
import { getApplicationWithStubbedDependencies } from '../../../utils/module-for-testing'

describe('ReferentielsController', () => {
  let getMotifsSuppressionQueryHandler: StubbedClass<GetMotifsSuppressionJeuneQueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getMotifsSuppressionQueryHandler = app.get(
      GetMotifsSuppressionJeuneQueryHandler
    )
  })

  after(async () => {
    await app.close()
  })

  describe('GET /v2/referentiels/motifs-suppression-jeune', () => {
    it("renvoie les motifs de suppression d'un compte jeune", () => {
      // Given
      getMotifsSuppressionQueryHandler.execute.resolves(success([]))

      // When - Then
      return request(app.getHttpServer())
        .get('/v2/referentiels/motifs-suppression-jeune')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
    })
  })
})
