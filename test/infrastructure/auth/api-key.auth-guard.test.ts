import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import supertest from 'supertest'
import { buildTestingModuleForHttpTesting, expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'

const erreurPasDeApiKey = {
  error: 'Unauthorized',
  message: "API KEY non présent dans le header 'X-API-KEY'",
  statusCode: 401
}

const erreurApiKeyInvalide = {
  error: 'Unauthorized',
  message: 'API KEY non valide',
  statusCode: 401
}

describe(`ApiKeyAuthGuard`, () => {
  let app: INestApplication
  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting().compile()
    app = testingModule.createNestApplication()
    await app.init()
  })
  after(async () => {
    await app.close()
  })

  describe('pas de header X-API-KEY', () => {
    let response: supertest.Response
    it('retourne 401 status code', async () => {
      // When
      response = await request(app.getHttpServer()).get('/fake/api-key')
      //Then
      expect(response).to.have.property('statusCode').to.equal(401)
      expect(response.body).to.be.deep.equal(erreurPasDeApiKey)
    })
  })
  describe('header X-API-KEY + keycloak valide', () => {
    let response: supertest.Response
    it('retourne 200 status code', async () => {
      // When
      const apiKey: string = testConfig().get<string>('apiKeys.keycloak')!
      response = await request(app.getHttpServer())
        .get('/fake/api-key/keycloak')
        .set('X-API-KEY', apiKey)

      //Then
      expect(response).to.have.property('statusCode').to.equal(200)
    })
  })

  describe('header X-API-KEY + keycloak non valide', () => {
    let response: supertest.Response
    it('retourne 401 status code', async () => {
      // When
      const apiKey = 'invalide'
      response = await request(app.getHttpServer())
        .get('/fake/api-key/keycloak')
        .set('X-API-KEY', apiKey)

      //Then
      expect(response).to.have.property('statusCode').to.equal(401)
      expect(response.body).to.be.deep.equal(erreurApiKeyInvalide)
    })
  })

  describe('header X-API-KEY + immersion valide', () => {
    let response: supertest.Response
    it('retourne 200 status code', async () => {
      // When
      const apiKey: string = testConfig().get<string>('apiKeys.immersion')!
      response = await request(app.getHttpServer())
        .get('/fake/api-key/immersion')
        .set('X-API-KEY', apiKey)

      //Then
      expect(response).to.have.property('statusCode').to.equal(200)
    })
  })
  describe('header X-API-KEY + immersion non valide', () => {
    let response: supertest.Response
    it('retourne 401 status code', async () => {
      // When
      const apiKey = 'invalide'
      response = await request(app.getHttpServer())
        .get('/fake/api-key/immersion')
        .set('X-API-KEY', apiKey)

      //Then
      expect(response).to.have.property('statusCode').to.equal(401)
      expect(response.body).to.be.deep.equal(erreurApiKeyInvalide)
    })
  })
})
