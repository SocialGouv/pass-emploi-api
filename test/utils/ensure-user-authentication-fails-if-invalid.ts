import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import supertest from 'supertest'
import { expect } from '.'
import { JwtService } from '../../src/infrastructure/auth/jwt.service'
import {
  buildTestingModuleForHttpTesting,
  FakeJwtService
} from './module-for-testing'

export function ensureUserAuthenticationFailsIfInvalid(
  method: string,
  path: string
): void {
  describe(`Authentification for ${method} ${path}`, () => {
    let app: INestApplication
    before(async () => {
      const testingModule = await buildTestingModuleForHttpTesting()
        .overrideProvider(JwtService)
        .useValue(new FakeJwtService(false))
        .compile()
      app = testingModule.createNestApplication()
      await app.init()
    })
    after(async () => {
      await app.close()
    })
    context('with invalid token', () => {
      let response: supertest.Response

      beforeEach(async () => {
        // When
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        response = await request(app.getHttpServer())
          [method.toLowerCase()](path)
          .set('Authorization', 'bearer 1234')
      })

      it('replies 401 status code', () => {
        expect(response).to.have.property('statusCode').to.equal(401)
      })
    })

    context('without token', () => {
      let response: supertest.Response

      beforeEach(async () => {
        // When
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        response = await request(app.getHttpServer())[method.toLowerCase()](
          path
        )
      })

      it('replies 401 status code', () => {
        expect(response).to.have.property('statusCode').to.equal(401)
      })
    })
  })
}
