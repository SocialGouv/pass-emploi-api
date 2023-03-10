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
  describe('postFormulaireImmersion', () => {
    it('fait un appel en succes', async () => {
      // Given
      const params = {
        offer: {
          romeCode: 'romeCode',
          romeLabel: 'romeLabel'
        },
        siret: 'siret',
        potentialBeneficiaryFirstName: 'potentialBeneficiaryFirstName',
        potentialBeneficiaryLastName: 'potentialBeneficiaryLastName',
        potentialBeneficiaryEmail: 'potentialBeneficiaryEmail',
        contactMode: 'EMAIL',
        message: 'test'
      }

      nock('https://api.api-immersion.beta.gouv.op')
        .post('/v1/contact-establishment', params)
        .reply(200, {})
        .isDone()

      // When
      const response = await immersionClient.postFormulaireImmersion(params)

      // Then
      expect(response._isSuccess).to.equal(true)
    })
    it('fait un appel en echec et renvoie une failure', async () => {
      // Given
      const params = {
        offer: {
          romeCode: 'romeCode',
          romeLabel: 'romeLabel'
        },
        siret: 'siret',
        potentialBeneficiaryFirstName: 'potentialBeneficiaryFirstName',
        potentialBeneficiaryLastName: 'potentialBeneficiaryLastName',
        potentialBeneficiaryEmail: 'potentialBeneficiaryEmail',
        contactMode: 'EMAIL',
        message: 'test'
      }

      nock('https://api.api-immersion.beta.gouv.op')
        .post('/v1/contact-establishment', params)
        .reply(429, {})
        .isDone()

      // When
      const response = await immersionClient.postFormulaireImmersion(params)

      // Then
      expect(response._isSuccess).to.equal(false)
    })
  })
})
