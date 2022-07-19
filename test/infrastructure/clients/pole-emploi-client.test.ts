import { HttpService } from '@nestjs/axios'
import { DateTime } from 'luxon'
import * as nock from 'nock'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { DateService } from 'src/utils/date-service'
import { RateLimiterService } from 'src/utils/rate-limiter.service'
import { expect, stubClass } from 'test/utils'
import {
  notificationsRDVPEDto,
  uneOffreEmploiDto
} from '../../fixtures/offre-emploi.fixture'
import { desTypesDemarchesDto } from '../../fixtures/pole-emploi.dto.fixture'
import { testConfig } from '../../utils/module-for-testing'

describe('PoleEmploiClient', () => {
  let poleEmploiClient: PoleEmploiClient
  const uneDatetimeDeMaintenant = DateTime.fromISO(
    '2020-04-06T12:00:00.000Z'
  ).toUTC()
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  beforeEach(() => {
    const httpService = new HttpService()

    const dateService = stubClass(DateService)
    dateService.now.returns(uneDatetimeDeMaintenant)

    poleEmploiClient = new PoleEmploiClient(
      httpService,
      configService,
      dateService,
      rateLimiterService
    )
  })
  describe('getToken', () => {
    it('retourne un nouveau token quand pas de token en mémoire', async () => {
      // Given
      poleEmploiClient.inMemoryToken = {
        token: undefined,
        tokenDate: undefined
      }
      nock('https://entreprise.pole-emploi.fr')
        .post(
          '/connexion/oauth2/access_token',
          'grant_type=client_credentials&client_id=pole-emploi-client-id&client_secret=pole-emploi-client-secret&scope=pole-emploi-scope'
        )
        .query({
          realm: '/partenaire'
        })
        .reply(201, {
          access_token: 'un-premier-token',
          expires_in: 1499
        })
        .isDone()

      // When
      const token = await poleEmploiClient.getToken()

      // Then
      expect(token).to.equal('un-premier-token')
    })

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
  describe('get', () => {
    it('fait un http get avec les bons paramètres', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.emploi-store.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(200, {
          resultats: []
        })
        .isDone()

      // When
      const response = await poleEmploiClient.get('offresdemploi/v2/offres/1')

      // Then
      expect(response.status).to.equal(200)
      expect(response.data).to.deep.equal({ resultats: [] })
    })
  })
  describe('getOffreEmploi', () => {
    it("récupère l'offre quand elle existe", async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.emploi-store.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(200, uneOffreEmploiDto())
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffreEmploi('1')

      // Then
      expect(offreEmploi).to.deep.equal(uneOffreEmploiDto())
    })
  })
  describe('getNotificationsRDV', () => {
    it('récupère les notifications', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }
      const body = {
        listeIdExterneDE: [],
        dateDebutCreation: '2020-10-09',
        dateFinCreation: '2020-10-10'
      }

      nock('https://api.emploi-store.fr/partenaire')
        .post(
          '/listernotificationspartenaires/v1/notifications/partenaires',
          body
        )
        .reply(200, notificationsRDVPEDto())
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getNotificationsRDV(
        [],
        '2020-10-09',
        '2020-10-10'
      )

      // Then
      expect(offreEmploi).to.deep.equal(notificationsRDVPEDto())
    })
  })
  describe('rechercherTypesDemarches', () => {
    describe('quand il y a des démarches', () => {
      it('renvoie les types de démarche', async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.emploi-store.fr/partenaire')
          .post('/rechercher-demarche/v1/solr/search/demarche', {
            codeUtilisateur: 0,
            motCle: 'salon'
          })
          .reply(200, { listeDemarches: desTypesDemarchesDto() })
          .isDone()

        // When
        const typeDemarcheDtos =
          await poleEmploiClient.rechercherTypesDemarches('salon')

        // Then
        expect(typeDemarcheDtos).to.deep.equal(desTypesDemarchesDto())
      })
    })
    describe("quand il n'y a pas de démarche", () => {
      it('renvoie un tableau vide', async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.emploi-store.fr/partenaire')
          .post('/rechercher-demarche/v1/solr/search/demarche', {
            codeUtilisateur: 0,
            motCle: 'salon'
          })
          .reply(200, { listeDemarches: undefined })
          .isDone()

        // When
        const typeDemarcheDtos =
          await poleEmploiClient.rechercherTypesDemarches('salon')

        // Then
        expect(typeDemarcheDtos).to.deep.equal([])
      })
    })
    describe("quand ce n'est pas sur staging ou development", () => {
      describe('quand PE est cassé', () => {
        it('renvoie une erreur', async () => {
          // Given
          const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
            minutes: 20
          })
          poleEmploiClient.inMemoryToken = {
            token: 'test-token',
            tokenDate: uneDatetimeDeMoinsDe25Minutes
          }

          nock('https://api.emploi-store.fr/partenaire')
            .post('/rechercher-demarche/v1/solr/search/demarche', {
              codeUtilisateur: 0,
              motCle: 'salon'
            })
            .reply(500)
            .isDone()

          // When
          const call = poleEmploiClient.rechercherTypesDemarches('salon')

          // Then
          await expect(call).to.be.rejected()
        })
      })
    })
  })
})
