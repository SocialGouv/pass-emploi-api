import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { ImmersionClient } from '../../../src/infrastructure/clients/immersion-client'
import { URLSearchParams } from 'url'
import { success } from '../../../src/building-blocks/types/result'

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
        .get('/v2/search/siret/appellationCode')
        .reply(200, {
          resultats
        })
        .isDone()

      // When
      const response = await immersionClient.get(
        'v2/search/siret/appellationCode'
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats })
    })
  })

  describe('getOffres', () => {
    it('fait un http get avec les bons paramètres', async () => {
      // Given
      const location = {
        lat: 48.502103949334845,
        lon: 2.13082255225161
      }
      const distanceKm = 30
      const appellationCodes = ['10868']

      const resultat = {
        data: [
          {
            rome: 'mon-rome',
            siret: 'siret',
            romeLabel: 'romeLabel',
            name: 'name',
            nafLabel: 'nafLabel',
            address: { city: 'city' },
            voluntaryToImmersion: true,
            appellations: [
              {
                appellationCode: 'appellationCode',
                appellationLabel: 'appellationCodeLabel'
              }
            ]
          }
        ],
        status: 200,
        statusText: 'OK',
        request: '',
        headers: '',
        config: ''
      }

      const params = new URLSearchParams()
      params.append('distanceKm', distanceKm.toString())
      params.append('longitude', location.lon.toString())
      params.append('latitude', location.lat.toString())
      params.append('appellationCodes[]', appellationCodes[0])
      params.append('sortedBy', 'date')
      params.append('voluntaryToImmersion', 'true')

      nock('https://api.api-immersion.beta.gouv.op')
        .get(
          '/v2/search?distanceKm=30&longitude=2.13082255225161&latitude=48.502103949334845&appellationCodes%5B%5D=10868&sortedBy=date&voluntaryToImmersion=true'
        )
        .reply(200, resultat)
        .isDone()

      // When
      const response = await immersionClient.getOffres(params)

      // Then
      expect(response).to.deep.equal(success(resultat))
    })
  })

  describe('getDetailOffre', () => {
    it('fait un http get avec les bons paramètres', async () => {
      // Given

      const resultat = {
        data: {
          rome: 'mon-rome',
          siret: 'siret',
          romeLabel: 'romeLabel',
          name: 'name',
          nafLabel: 'nafLabel',
          address: { city: 'city' },
          voluntaryToImmersion: true,
          appellations: [
            {
              appellationCode: 'appellationCode',
              appellationLabel: 'appellationCodeLabel'
            }
          ]
        },
        status: 200,
        statusText: 'OK',
        request: '',
        headers: '',
        config: ''
      }

      nock('https://api.api-immersion.beta.gouv.op')
        .get('/v2/search/siret/appellationCode')
        .reply(200, resultat)
        .isDone()

      // When
      const response = await immersionClient.getDetailOffre(
        'siret/appellationCode'
      )

      // Then
      expect(response).to.deep.equal(success(resultat))
    })
  })
  describe('postFormulaireImmersion', () => {
    it('fait un appel en succes', async () => {
      // Given
      const params = {
        appellationCode: '11573',
        siret: 'siret',
        potentialBeneficiaryFirstName: 'potentialBeneficiaryFirstName',
        potentialBeneficiaryLastName: 'potentialBeneficiaryLastName',
        potentialBeneficiaryEmail: 'potentialBeneficiaryEmail',
        potentialBeneficiaryPhone: 'non communiqué',
        immersionObjective: "Découvrir un métier ou un secteur d'activité",
        contactMode: 'EMAIL',
        message: 'test',
        locationId: ''
      }

      nock('https://api.api-immersion.beta.gouv.op')
        .post('/v2/contact-establishment', params)
        .reply(200, {})
        .isDone()

      // When
      const response = await immersionClient.envoyerFormulaireImmersion(params)

      // Then
      expect(response._isSuccess).to.equal(true)
    })
    it('fait un appel en echec et renvoie une failure', async () => {
      // Given
      const params = {
        appellationCode: '11573',
        siret: 'siret',
        potentialBeneficiaryFirstName: 'potentialBeneficiaryFirstName',
        potentialBeneficiaryLastName: 'potentialBeneficiaryLastName',
        potentialBeneficiaryEmail: 'potentialBeneficiaryEmail',
        potentialBeneficiaryPhone: 'non communiqué',
        immersionObjective: "Découvrir un métier ou un secteur d'activité",
        contactMode: 'EMAIL',
        message: 'test',
        locationId: ''
      }

      nock('https://api.api-immersion.beta.gouv.op')
        .post('/v2/contact-establishment', params)
        .reply(429, {})
        .isDone()

      // When
      const response = await immersionClient.envoyerFormulaireImmersion(params)

      // Then
      expect(response._isSuccess).to.equal(false)
    })
  })
})
