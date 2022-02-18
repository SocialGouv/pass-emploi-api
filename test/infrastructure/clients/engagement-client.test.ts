import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'

describe('EngagementClient', () => {
  let engagementClient: EngagementClient
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()

    engagementClient = new EngagementClient(httpService, configService)
  })
  describe('get', () => {
    it('fait un http get avec les bons paramètres', async () => {
      // Given
      const resultats = {
        hits: [
          {
            id: 'unId',
            title: 'unTitre',
            startAt: '2022-02-17T10:00:00.000Z',
            domain: 'Informatique',
            city: 'paris'
          }
        ]
      }
      nock('https://api.api-engagement.beta.gouv.op')
        .get('/v0/mission/search?domain=environnement')
        .reply(200, {
          resultats
        })
        .isDone()

      const urlSearchParams: URLSearchParams = new URLSearchParams()
      urlSearchParams.append('domain', 'environnement')

      // When
      const response = await engagementClient.get(
        'v0/mission/search',
        urlSearchParams
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats })
    })
  })
})
