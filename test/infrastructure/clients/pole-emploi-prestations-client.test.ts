import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { PoleEmploiPrestationsClient } from '../../../src/infrastructure/clients/pole-emploi-prestations-client'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('PoleEmploiPrestationsClient', () => {
  let poleEmploiPrestationsClient: PoleEmploiPrestationsClient
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    poleEmploiPrestationsClient = new PoleEmploiPrestationsClient(
      httpService,
      configService
    )
  })

  describe('getRendezVous', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const tokenJeune = 'token'

      nock('https://api-r.es-qvr.fr/partenaire/peconnect-gerer-prestations/v1')
        .get('/rendez-vous?dateRecherche=2020-04-06')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPrestationsClient.getRendezVous(
        tokenJeune,
        uneDatetime
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })

  describe('getLienVisio', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const tokenJeune = 'token'
      const idVisio = '1'

      nock('https://api-r.es-qvr.fr/partenaire/peconnect-gerer-prestations/v1')
        .get('/lien-visio/rendez-vous/1')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPrestationsClient.getLienVisio(
        tokenJeune,
        idVisio
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })
})
