import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { expect } from 'chai'
import { DateTime } from 'luxon'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { DateService } from 'src/utils/date-service'
import { stubClass } from 'test/utils'

describe('PoleEmploiClient', () => {
  describe('getToken', () => {
    // it('retourne un nouveau token quand pas de token en mémoire', () => {})

    // it('retourne un token quand token en mémoire expiré', () => {})

    it('retourne un token en mémoire quand le token en mémoire est valide', async () => {
      // Given

      const uneDatetimeDeMaintenant = DateTime.fromISO(
        '2020-04-06T12:00:00.000Z'
      ).toUTC()
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.plus({
        minutes: 20
      })

      const configService = {
        get: (): unknown => {
          return {
            url: 'https://api.emploi-store.fr/partenaire',
            loginUrl:
              'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token',
            clientId: 'pole-emploi-client-id',
            clientSecret: 'pole-emploi-client-secret',
            scope: 'pole-emploi-scope'
          }
        }
      } as unknown as ConfigService

      const httpService = new HttpService()
      const dateService = stubClass(DateService)
      dateService.now.returns(uneDatetimeDeMaintenant)

      const poleEmploiClient = new PoleEmploiClient(
        httpService,
        configService,
        dateService
      )

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
