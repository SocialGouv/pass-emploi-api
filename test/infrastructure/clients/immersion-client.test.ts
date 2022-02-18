import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { ImmersionClient } from '../../../src/infrastructure/clients/immersion-client'

describe('ImmersionClient', () => {
  let immersionClient: ImmersionClient
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()

    immersionClient = new ImmersionClient(httpService, configService)
  })
  describe('get', () => {
    it('fait un http get avec les bons paramètres', async () => {
      // Given
      const resultats = [
        {
          id: 'unId',
          title: 'unTitre',
          startAt: '2022-02-17T10:00:00.000Z',
          domain: 'Informatique',
          city: 'paris'
        }
      ]
      nock('https://api.api-immersion.beta.gouv.op')
        .get('/get-immersion-by-id/plop')
        .reply(200, {
          resultats
        })
        .isDone()

      // When
      const response = await immersionClient.get('get-immersion-by-id/plop')

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats })
    })
  })
  describe('post', () => {
    it('fait un http post avec les bons paramètres', async () => {
      // Given
      const resultats = [
        {
          id: 'unId',
          title: 'unTitre',
          startAt: '2022-02-17T10:00:00.000Z',
          domain: 'Informatique',
          city: 'paris'
        }
      ]
      nock('https://api.api-immersion.beta.gouv.op')
        .post('/get-immersion', {
          body: 'body'
        })
        .reply(200, {
          resultats
        })
        .isDone()

      // When
      const response = await immersionClient.post('get-immersion', {
        body: 'body'
      })

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats })
    })
  })
})
