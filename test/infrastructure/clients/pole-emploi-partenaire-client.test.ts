import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { uneDatetime } from '../../fixtures/date.fixture'
import { PoleEmploiPartenaireClient } from '../../../src/infrastructure/clients/pole-emploi-partenaire-client'

describe('PoleEmploiPartenaireClient', () => {
  let poleEmploiPartenaireClient: PoleEmploiPartenaireClient
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    poleEmploiPartenaireClient = new PoleEmploiPartenaireClient(
      httpService,
      configService
    )
  })

  describe('getPrestations', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const tokenJeune = 'token'

      nock('https://api-r.es-qvr.fr/partenaire')
        .get(
          '/peconnect-gerer-prestations/v1/rendez-vous?dateRecherche=2020-04-06'
        )
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getPrestations(
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

      nock('https://api-r.es-qvr.fr/partenaire')
        .get('/peconnect-gerer-prestations/v1/lien-visio/rendez-vous/1')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getLienVisio(
        tokenJeune,
        idVisio
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })

  describe('getRendezVouss', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const tokenJeune = 'token'

      nock('https://api-r.es-qvr.fr/partenaire')
        .get('/peconnect-rendezvousagenda/v1/listerendezvous')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiPartenaireClient.getRendezVous(
        tokenJeune
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })
})
