import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { testConfig } from '../../utils/module-for-testing'
import { PoleEmploiRendezVousClient } from '../../../src/infrastructure/clients/pole-emploi-rendez-vous-client'

describe('PoleEmploiRendezVousClient', () => {
  let poleEmploiRendezVousClient: PoleEmploiRendezVousClient
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    poleEmploiRendezVousClient = new PoleEmploiRendezVousClient(
      httpService,
      configService
    )
  })

  describe('getRendezVous', () => {
    it('fait un appel http get avec les bons paramètres', async () => {
      // Given
      const tokenJeune = 'token'

      nock(
        'https://api.emploi-store.fr/partenaire/peconnect-rendezvousagenda/v1'
      )
        .get('/listerendezvous')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiRendezVousClient.getRendezVous(
        tokenJeune
      )

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })
})
