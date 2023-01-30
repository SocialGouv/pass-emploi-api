import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { TypeUrlDiagoriente } from '../../../src/application/queries/get-diagoriente-url.query.handler.db'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
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
        '{"query":"mutation PartnerAuthURL(\\n  $clientId: String!\\n  $clientSecret: String!\\n  $userInfo: PartnerAuthUserInfo!\\n  $redirectUri: String\\n) {\\n  partnerAuthURL(\\n    clientId: $clientId\\n    clientSecret: $clientSecret\\n    userInfo: $userInfo\\n    redirectUri: $redirectUri\\n  )\\n}","variables":{"clientId":"diagoriente-client-id","clientSecret":"diagoriente-client-secret","userInfo":{"userId":"ABCDE","email":"john.doe@plop.io","firstName":"John","lastName":"Doe"},"redirectUri":"/centres_interet/chat"}}'
      const expectedUrl =
        'https://dev-cej.diagoriente.fr/whatever?redirectUri=/centres_interet/chat'

      nock(apiUrl)
        .post('/graphql', expectedBody)
        .reply(200, { data: { partnerAuthURL: expectedUrl } })

      // When
      const result = await diagorienteClient.getUrl(type, {
        id: jeune.id,
        email: jeune.email,
        prenom: jeune.firstName,
        nom: jeune.lastName
      })

      // Then
      expect(result).to.deep.equal(success(expectedUrl))
    })
    it("renvoie une failure quand l'api est en erreur", async () => {
      // Given
      const type = TypeUrlDiagoriente.CHATBOT
      const expectedBody =
        '{"query":"mutation PartnerAuthURL(\\n  $clientId: String!\\n  $clientSecret: String!\\n  $userInfo: PartnerAuthUserInfo!\\n  $redirectUri: String\\n) {\\n  partnerAuthURL(\\n    clientId: $clientId\\n    clientSecret: $clientSecret\\n    userInfo: $userInfo\\n    redirectUri: $redirectUri\\n  )\\n}","variables":{"clientId":"diagoriente-client-id","clientSecret":"diagoriente-client-secret","userInfo":{"userId":"ABCDE","email":"john.doe@plop.io","firstName":"John","lastName":"Doe"},"redirectUri":"/centres_interet/chat"}}'

      nock(apiUrl).post('/graphql', expectedBody).reply(429)

      // When
      const result = await diagorienteClient.getUrl(type, {
        id: jeune.id,
        email: jeune.email,
        prenom: jeune.firstName,
        nom: jeune.lastName
      })

      // Then
      expect(result).to.deep.equal(
        failure(
          new ErreurHttp("La récupération de l'url Diagoriente a échoué", 429)
        )
      )
    })
  })
})
