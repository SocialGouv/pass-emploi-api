import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('ConfigController', () => {
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
  })

  describe('GET /config', () => {
    it("renvoie la config placée dans l'env", () => {
      // Given

      // When - Then
      return request(app.getHttpServer())
        .get('/config')
        .set('Authorization', 'Bearer ceci-est-un-jwt')
        .expect(HttpStatus.OK)
        .expect({ conseillersCVM: ['ok'] })
    })
  })
})
