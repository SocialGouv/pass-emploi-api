import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import { DateTime } from 'luxon'
import * as nock from 'nock'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { DateService } from 'src/utils/date-service'
import { stubClass } from 'test/utils'
import { testConfig } from '../../utils/module-for-testing'

describe('PoleEmploiClient', () => {
  describe('getToken', () => {
    let poleEmploiClient: PoleEmploiClient
    const uneDatetimeDeMaintenant = DateTime.fromISO(
      '2020-04-06T12:00:00.000Z'
    ).toUTC()
    const configService = testConfig()

    beforeEach(() => {
      const httpService = new HttpService()

      const dateService = stubClass(DateService)
      dateService.now.returns(uneDatetimeDeMaintenant)

      poleEmploiClient = new PoleEmploiClient(
        httpService,
        configService,
        dateService
      )
    })
    // it('retourne un nouveau token quand pas de token en mémoire', () => {})

    it('retourne un token quand token en mémoire expiré', async () => {
      // Given
      const uneDatetimeDePlusDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 26
      })

      poleEmploiClient.inMemoryToken = {
        token: 'un-token-de-plus-de-25-min',
        tokenDate: uneDatetimeDePlusDe25Minutes
      }
      poleEmploiClient.tokenExpiryInSeconds = 1499

      nock('https://entreprise.pole-emploi.fr')
        .post(
          '/connexion/oauth2/access_token',
          'grant_type=client_credentials&client_id=pole-emploi-client-id&client_secret=pole-emploi-client-secret&scope=pole-emploi-scope'
        )
        .query({
          realm: '/partenaire'
        })
        .reply(201, {
          access_token: 'un-nouveau-token',
          expires_in: 1499
        })
        .isDone()

      // When
      const token = await poleEmploiClient.getToken()

      // Then
      expect(token).to.equal('un-nouveau-token')
    })

    it('retourne un token en mémoire quand le token en mémoire est valide', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })

      poleEmploiClient.inMemoryToken = {
        token: 'un-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      // When
      const token = await poleEmploiClient.getToken()

      // Then
      expect(token).to.equal('un-token')
    })
  })
})
