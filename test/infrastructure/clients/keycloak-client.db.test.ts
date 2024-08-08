import { HttpService } from '@nestjs/axios'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import * as nock from 'nock'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client.db'
import { expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { getDatabase } from '../../utils/database-for-testing'

describe('KeycloakClient', () => {
  let keycloakClient: KeycloakClient
  const configService = testConfig()
  const issuerUrl = configService.get('oidcSSO').issuerUrl
  const clientId = configService.get('oidcSSO').clientId
  const clientSecret = configService.get('oidcSSO').clientSecret

  beforeEach(async () => {
    const httpService = new HttpService()
    keycloakClient = new KeycloakClient(configService, httpService)
  })

  describe('deleteUserByIdUser', () => {
    const apiUrl = configService.get('oidcInternal').issuerApiUrl
    it('echoue lorsque la récupération du token est en erreur', async () => {
      // Given
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(400)

      try {
        // When
        await keycloakClient.deleteUserByIdUser('id')
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {
        // Then
        expect(e).to.be.an.instanceOf(RuntimeException)
      }
    })
    it("echoue lorsque la récupération de l'utilisateur est en erreur", async () => {
      // Given
      const token = 'tok'
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(200, { access_token: token })

      const idUser = 'id'
      nock(apiUrl).get(`/users?q=id_user:${idUser}`).reply(400)

      try {
        // When
        await keycloakClient.deleteUserByIdUser(idUser)
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {
        // Then
        expect(e).to.be.an.instanceOf(RuntimeException)
      }
    })
    it("passe lorsque la récupération de l'utilisateur est 404", async () => {
      // Given
      const token = 'tok'
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(200, { access_token: token })

      const idUser = 'id'
      nock(apiUrl).get(`/users?q=id_user:${idUser}`).reply(404)

      try {
        // When
        await keycloakClient.deleteUserByIdUser(idUser)
      } catch (e) {
        // Then
        expect.fail(null, null, 'handle test rejected with an error')
      }
    })
    it("passe sans supprimer lorsque la récupération de l'utilisateur est vide", async () => {
      // Given
      const token = 'tok'
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(200, { access_token: token })

      const idUser = 'id'
      nock(apiUrl).get(`/users?q=id_user:${idUser}`).reply(200, [])

      try {
        // When
        await keycloakClient.deleteUserByIdUser(idUser)
      } catch (e) {
        // Then
        expect.fail(null, null, 'handle test rejected with an error')
      }
    })
    it("echoue lorsque la suppression de l'utilisateur est en erreur", async () => {
      // Given
      const token = 'tok'
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(200, { access_token: token })

      const idUser = 'id'
      const idkeycloak = 'idKc'
      nock(apiUrl)
        .get(`/users?q=id_user:${idUser}`)
        .reply(200, [{ id: idkeycloak }])

      nock(apiUrl).delete(`/users/${idkeycloak}`).reply(400)

      try {
        // When
        await keycloakClient.deleteUserByIdUser(idUser)
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {
        // Then
        expect(e).to.be.an.instanceOf(RuntimeException)
      }
    })
    it("passe lorsque la suppression de l'utilisateur est 404", async () => {
      // Given
      const token = 'tok'
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(200, { access_token: token })

      const idUser = 'id'
      const idkeycloak = 'idKc'
      nock(apiUrl)
        .get(`/users?q=id_user:${idUser}`)
        .reply(200, [{ id: idkeycloak }])

      nock(apiUrl).delete(`/users/${idkeycloak}`).reply(404)

      try {
        // When
        await keycloakClient.deleteUserByIdUser(idUser)
      } catch (e) {
        // Then
        expect.fail(null, null, 'handle test rejected with an error')
      }
    })
    it("passe lorsque la suppression de l'utilisateur est ok", async () => {
      // Given
      const token = 'tok'
      nock(issuerUrl)
        .post('/protocol/openid-connect/token', {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret
        })
        .reply(200, { access_token: token })

      const idUser = 'id'
      const idkeycloak = 'idKc'
      nock(apiUrl)
        .get(`/users?q=id_user:${idUser}`)
        .reply(200, [{ id: idkeycloak }])

      nock(apiUrl).delete(`/users/${idkeycloak}`).reply(200)

      try {
        // When
        await keycloakClient.deleteUserByIdUser(idUser)
      } catch (e) {
        // Then
        expect.fail(null, null, 'handle test rejected with an error')
      }
    })
  })

  describe('deleteAccountFromNewAuth', () => {
    const apiUrl = configService.get('oidcSSO').issuerApiUrl
    beforeEach(async () => {
      await getDatabase().cleanPG()
    })
    it("passe lorsque l'appel d'api est ok avec user jeune", async () => {
      // Given
      const idAuthentification = 'idAuth'
      const id = 'idCejJeune'
      await ConseillerSqlModel.create(unConseillerDto())
      await JeuneSqlModel.create(unJeuneDto({ id, idAuthentification }))
      nock(apiUrl).delete('/accounts/idAuth').reply(204)

      try {
        // When
        await keycloakClient.deleteAccountFromOIDCSSO(id)
      } catch (e) {
        // Then
        expect.fail(null, null, 'handle test rejected with an error')
      }
    })
    it("passe lorsque l'appel d'api est ok avec user conseiller", async () => {
      // Given
      const idAuthentification = 'idAuth'
      const id = 'idCejConseiller'
      await ConseillerSqlModel.create(
        unConseillerDto({ id, idAuthentification })
      )
      nock(apiUrl).delete('/accounts/idAuth').reply(204)

      try {
        // When
        await keycloakClient.deleteAccountFromOIDCSSO(id)
      } catch (e) {
        // Then
        expect.fail(null, null, 'handle test rejected with an error')
      }
    })
    it("echoue lorsque l'appel d'api est ko", async () => {
      // Given
      nock(apiUrl).delete('/accounts/idAuth').reply(500)

      try {
        // When
        await keycloakClient.deleteAccountFromOIDCSSO('idAuth')
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {}
    })
  })
})
