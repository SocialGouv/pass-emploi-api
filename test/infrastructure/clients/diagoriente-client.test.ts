import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { TypeUrlDiagoriente } from '../../../src/application/queries/get-diagoriente-urls.query.handler'
import {
  CompteDiagorienteInvalideError,
  ErreurHttp
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { DiagorienteClient } from '../../../src/infrastructure/clients/diagoriente-client'
import { unJeune } from '../../fixtures/jeune.fixture'
import { expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'

describe('DiagorienteClient', () => {
  let diagorienteClient: DiagorienteClient
  const configService = testConfig()
  const apiUrl = configService.get('diagoriente').url
  const jeune = unJeune()

  beforeEach(async () => {
    const httpService = new HttpService()
    diagorienteClient = new DiagorienteClient(httpService, configService)
  })

  describe('getUrl', () => {
    it("renvoie l'url d'accès au chatbot", async () => {
      // Given
      const type = TypeUrlDiagoriente.CHATBOT
      const expectedBody =
        '{"query":"mutation PartnerAuthURL(\\n  $clientId: String!\\n  $clientSecret: String!\\n  $userInfo: PartnerAuthUserInfo!\\n  $redirectUri: String\\n) {\\n  partnerAuthURL(\\n    clientId: $clientId\\n    clientSecret: $clientSecret\\n    userInfo: $userInfo\\n    redirectUri: $redirectUri\\n  )\\n}","variables":{"clientId":"diagoriente-client-id","clientSecret":"diagoriente-client-secret","userInfo":{"userId":"ABCDE","email":"2ecdde3959051d913f61b14579ea136d@pass-emploi.beta.gouv.fr","firstName":"Utilisateur","lastName":"Pass Emploi"},"redirectUri":"/centres_interet/chat"}}'
      const expectedUrl =
        'https://dev-cej.diagoriente.fr/whatever?redirectUri=/centres_interet/chat'

      nock(apiUrl)
        .post('/graphql', expectedBody)
        .reply(200, { data: { partnerAuthURL: expectedUrl } })

      // When
      const result = await diagorienteClient.getUrl(type, {
        id: jeune.id,
        email: jeune.email
      })

      // Then
      expect(result).to.deep.equal(success(expectedUrl))
    })
    it("renvoie une failure quand l'api est en erreur", async () => {
      // Given
      const type = TypeUrlDiagoriente.CHATBOT
      const expectedBody =
        '{"query":"mutation PartnerAuthURL(\\n  $clientId: String!\\n  $clientSecret: String!\\n  $userInfo: PartnerAuthUserInfo!\\n  $redirectUri: String\\n) {\\n  partnerAuthURL(\\n    clientId: $clientId\\n    clientSecret: $clientSecret\\n    userInfo: $userInfo\\n    redirectUri: $redirectUri\\n  )\\n}","variables":{"clientId":"diagoriente-client-id","clientSecret":"diagoriente-client-secret","userInfo":{"userId":"ABCDE","email":"2ecdde3959051d913f61b14579ea136d@pass-emploi.beta.gouv.fr","firstName":"Utilisateur","lastName":"Pass Emploi"},"redirectUri":"/centres_interet/chat"}}'

      nock(apiUrl).post('/graphql', expectedBody).reply(429)

      // When
      const result = await diagorienteClient.getUrl(type, {
        id: jeune.id,
        email: jeune.email
      })

      // Then
      expect(result).to.deep.equal(
        failure(
          new ErreurHttp("La récupération de l'url Diagoriente a échoué", 429)
        )
      )
    })
  })

  describe('register', () => {
    it('renvoie un success', async () => {
      // Given
      const expectedBody =
        '{"query":"mutation ($clientId: String!, $clientSecret: String!, $userInfo: PartnerAuthUserInfo!) {\\r\\n  registerByPartner(clientId: $clientId, clientSecret: $clientSecret, userInfo: $userInfo) {\\r\\n    status\\r\\n  }\\r\\n}","variables":{"clientId":"diagoriente-client-id","clientSecret":"diagoriente-client-secret","userInfo":{"userId":"ABCDE","email":"2ecdde3959051d913f61b14579ea136d@pass-emploi.beta.gouv.fr","firstName":"Utilisateur","lastName":"Pass Emploi"}}}'

      nock(apiUrl).post('/graphql', expectedBody).reply(200, { data: {} })

      // When
      const result = await diagorienteClient.register({
        id: jeune.id,
        email: jeune.email
      })

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it("renvoie une failure quand l'id et email est déjà associé à un autre compte", async () => {
      // Given
      const expectedBody =
        '{"query":"mutation ($clientId: String!, $clientSecret: String!, $userInfo: PartnerAuthUserInfo!) {\\r\\n  registerByPartner(clientId: $clientId, clientSecret: $clientSecret, userInfo: $userInfo) {\\r\\n    status\\r\\n  }\\r\\n}","variables":{"clientId":"diagoriente-client-id","clientSecret":"diagoriente-client-secret","userInfo":{"userId":"ABCDE","email":"2ecdde3959051d913f61b14579ea136d@pass-emploi.beta.gouv.fr","firstName":"Utilisateur","lastName":"Pass Emploi"}}}'

      nock(apiUrl)
        .post('/graphql', expectedBody)
        .reply(200, { data: {}, errors: [] })

      // When
      const result = await diagorienteClient.register({
        id: jeune.id,
        email: jeune.email
      })

      // Then
      expect(result).to.deep.equal(
        failure(new CompteDiagorienteInvalideError(jeune.id))
      )
    })
  })

  describe('getMetiersFavoris', () => {
    it('renvoie les métiers favoris', async () => {
      // Given
      const expectedBody =
        '{"query":"query(\\r\\n  $userByPartnerClientId: String!\\r\\n  $userByPartnerClientSecret: String!\\r\\n  $userByPartnerUserId: String!\\r\\n) {\\r\\n  userByPartner(\\r\\n    clientId: $userByPartnerClientId\\r\\n    clientSecret: $userByPartnerClientSecret\\r\\n    userId: $userByPartnerUserId\\r\\n  ) {\\r\\n    favorites {\\r\\n      id\\r\\n      favorited\\r\\n      tag {\\r\\n        code\\r\\n        title\\r\\n      }\\r\\n    }\\r\\n  }\\r\\n}\\r\\n","variables":{"userByPartnerClientId":"diagoriente-client-id","userByPartnerClientSecret":"diagoriente-client-secret","userByPartnerUserId":"ABCDE"}}'

      nock(apiUrl)
        .post('/graphql', expectedBody)
        .reply(200, {
          userByPartner: {
            favorites: [
              {
                tag: {
                  code: 'string',
                  id: 'string',
                  title: 'string'
                },
                id: 'string',
                favorited: true
              }
            ]
          }
        })

      // When
      const result = await diagorienteClient.getMetiersFavoris(jeune.id)

      // Then
      expect(result).to.deep.equal(
        success({
          userByPartner: {
            favorites: [
              {
                tag: {
                  code: 'string',
                  id: 'string',
                  title: 'string'
                },
                id: 'string',
                favorited: true
              }
            ]
          }
        })
      )
    })

    it("renvoie une failure quand l'api est en erreur", async () => {
      // Given
      const expectedBody =
        '{"query":"query(\\r\\n  $userByPartnerClientId: String!\\r\\n  $userByPartnerClientSecret: String!\\r\\n  $userByPartnerUserId: String!\\r\\n) {\\r\\n  userByPartner(\\r\\n    clientId: $userByPartnerClientId\\r\\n    clientSecret: $userByPartnerClientSecret\\r\\n    userId: $userByPartnerUserId\\r\\n  ) {\\r\\n    favorites {\\r\\n      id\\r\\n      favorited\\r\\n      tag {\\r\\n        code\\r\\n        title\\r\\n      }\\r\\n    }\\r\\n  }\\r\\n}\\r\\n","variables":{"userByPartnerClientId":"diagoriente-client-id","userByPartnerClientSecret":"diagoriente-client-secret","userByPartnerUserId":"ABCDE"}}'

      nock(apiUrl).post('/graphql', expectedBody).reply(429)

      // When
      const result = await diagorienteClient.getMetiersFavoris(jeune.id)

      // Then
      expect(result).to.deep.equal(
        failure(
          new ErreurHttp(
            'La récupération des métiers favoris Diagoriente a échoué',
            429
          )
        )
      )
    })
  })
})
