import { HttpService } from '@nestjs/axios'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import * as nock from 'nock'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import { expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'

describe('KeycloakClient', () => {
  let keycloakClient: KeycloakClient
  const configService = testConfig()
  const issuerUrl = configService.get('oidc').issuerUrl
  const apiUrl = configService.get('oidc').issuerApiUrl
  const clientId = configService.get('oidc').clientId
  const clientSecret = configService.get('oidc').clientSecret

  beforeEach(async () => {
    const httpService = new HttpService()
    keycloakClient = new KeycloakClient(configService, httpService)
  })

  describe('deleteUserByIdUser', () => {
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
})
