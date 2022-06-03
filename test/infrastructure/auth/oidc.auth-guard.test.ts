import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import supertest from 'supertest'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { buildTestingModuleForHttpTesting, expect } from '../../utils'
import { FakeJwtService } from '../../utils/module-for-testing'

const erreurUnauthorized = {
  message: 'Unauthorized',
  statusCode: 401
}

const erreurUnauthorizedPasDeHeaderAuthorization = {
  error: 'Unauthorized',
  message: "Access token non présent dans le header 'Authorization'",
  statusCode: 401
}
const erreurUnauthorizedPasDeHeaderAuthorizationOuQueryParam = {
  error: 'Unauthorized',
  message:
    "Access token non présent dans le header 'Authorization' ou dans le query param 'token'",
  statusCode: 401
}

describe(`OidcAuthGuard`, () => {
  let appJwtKO: INestApplication
  let appJwtOK: INestApplication
  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(JwtService)
      .useValue(new FakeJwtService(false))
      .compile()
    appJwtKO = testingModule.createNestApplication()
    await appJwtKO.init()

    const testingModuleOK = await buildTestingModuleForHttpTesting()
      .overrideProvider(JwtService)
      .useValue(new FakeJwtService(true))
      .compile()
    appJwtOK = testingModuleOK.createNestApplication()
    await appJwtOK.init()
  })
  after(async () => {
    await appJwtKO.close()
    await appJwtOK.close()
  })
  context('OIDC header authorization', () => {
    describe('header authorization avec token invalide', () => {
      let response: supertest.Response

      it('retourne 401 status code', async () => {
        // When
        response = await request(appJwtKO.getHttpServer())
          .get('/fake')
          .set('Authorization', 'bearer 1234')
        //Then
        expect(response).to.have.property('statusCode').to.equal(401)
        expect(response.body).to.be.deep.equal(erreurUnauthorized)
      })
    })
    describe('pas de header authorization', () => {
      let response: supertest.Response

      it('retourne 401 status code', async () => {
        response = await request(appJwtKO.getHttpServer()).get('/fake')
        //Then
        expect(response).to.have.property('statusCode').to.equal(401)
        expect(response.body).to.be.deep.equal(
          erreurUnauthorizedPasDeHeaderAuthorization
        )
      })
    })
    describe('header authorization avec token valide', () => {
      let response: supertest.Response

      it('retourne 200 status code', async () => {
        // When
        response = await request(appJwtOK.getHttpServer())
          .get('/fake')
          .set('authorization', unHeaderAuthorization())

        //Then
        expect(response).to.have.property('statusCode').to.equal(200)
      })
    })
  })
  context('OIDC @Public', () => {
    describe('pas de header', () => {
      let response: supertest.Response

      it('retourne 200 status code', async () => {
        // When
        response = await request(appJwtKO.getHttpServer()).get('/fake/public')
        //Then
        expect(response).to.have.property('statusCode').to.equal(200)
      })
    })
  })
  context('OIDC @SkipOidcAuth', () => {
    describe('pas de header', () => {
      let response: supertest.Response

      it('retourne 200 status code', async () => {
        // When
        response = await request(appJwtKO.getHttpServer()).get(
          '/fake/skip-oidc-auth'
        )
        //Then
        expect(response).to.have.property('statusCode').to.equal(200)
      })
    })
  })
  context('OIDC @OidcQueryToken', () => {
    describe('pas de query param', () => {
      let response: supertest.Response

      it('retourne 401 status code', async () => {
        // When
        response = await request(appJwtKO.getHttpServer()).get(
          '/fake/oidc-query-token'
        )
        //Then
        expect(response).to.have.property('statusCode').to.equal(401)
        expect(response.body).to.be.deep.equal(
          erreurUnauthorizedPasDeHeaderAuthorizationOuQueryParam
        )
      })
    })
    describe('query param invalide', () => {
      let response: supertest.Response

      it('retourne 401 status code', async () => {
        // When
        response = await request(appJwtKO.getHttpServer()).get(
          '/fake/oidc-query-token?token=invalide'
        )
        //Then
        expect(response).to.have.property('statusCode').to.equal(401)
        expect(response.body).to.be.deep.equal(erreurUnauthorized)
      })
    })
    describe('query param valide', () => {
      let response: supertest.Response
      it('retourne 200 status code', async () => {
        // When
        response = await request(appJwtOK.getHttpServer()).get(
          '/fake/oidc-query-token?token=valide'
        )
        //Then
        expect(response).to.have.property('statusCode').to.equal(200)
      })
    })
  })
  context('OIDC @Utilisateur', () => {
    describe('token valide dans le header', () => {
      let response: supertest.Response

      it('utilisateur ajouté à la requête puis injecté dans le controller', async () => {
        // When
        response = await request(appJwtOK.getHttpServer())
          .get('/fake/utilisateur')
          .set('authorization', unHeaderAuthorization())

        //Then
        expect(response).to.have.property('statusCode').to.equal(200)
        expect(response.body).to.be.deep.equal(unUtilisateurDecode())
      })
    })
    describe('token valide dans le query param', () => {
      let response: supertest.Response

      it('utilisateur ajouté à la requête puis injecté dans le controller', async () => {
        // When
        response = await request(appJwtOK.getHttpServer()).get(
          '/fake/utilisateur?token=valide'
        )

        //Then
        expect(response).to.have.property('statusCode').to.equal(200)
        expect(response.body).to.be.deep.equal(unUtilisateurDecode())
      })
    })
  })
})
