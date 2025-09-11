import { HttpService } from '@nestjs/axios'
import { DateTime } from 'luxon'
import * as nock from 'nock'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess, success } from 'src/building-blocks/types/result'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { DateService } from 'src/utils/date-service'
import { RateLimiterService } from 'src/utils/rate-limiter.service'
import { desNotificationsDunJeunePoleEmploi } from 'test/fixtures/notification.fixture'
import {
  notificationsRDVPEDto,
  uneOffreEmploiDto
} from 'test/fixtures/offre-emploi.fixture'
import { expect, stubClass } from 'test/utils'
import { testConfig } from 'test/utils/module-for-testing'

describe('PoleEmploiClient', () => {
  let poleEmploiClient: PoleEmploiClient
  const uneDatetimeDeMaintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
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
  describe('getWithRetry', () => {
    describe("quand l'appel est OK", () => {
      it('fait un http get avec les bons paramètres et renvoie un succes', async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.peio.pe-qvr.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(200, {
            resultats: []
          })
          .isDone()

        // When
        const result = await poleEmploiClient.getWithRetry(
          'offresdemploi/v2/offres/1'
        )

        // Then
        expect(result._isSuccess).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.status).to.equal(200)
          expect(result.data.data).to.deep.equal({ resultats: [] })
        }
      })
    })
    describe("quand l'appel est KO", () => {
      it('renvoie une failure pour un retour http entre 400 et 500', async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.peio.pe-qvr.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(400)
          .isDone()

        // When
        const result = await poleEmploiClient.getWithRetry(
          'offresdemploi/v2/offres/1'
        )

        // Then
        expect(result).to.deep.equal(
          failure(new ErreurHttp('Erreur API POLE EMPLOI', 400))
        )
      })
      it("quand c'est une 429, retry après le temps qu'il faut", async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.peio.pe-qvr.fr/partenaire')
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/offresdemploi/v2/offres/1')
          .reply(429)
          .isDone()
        nock('https://api.peio.pe-qvr.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(200)
          .isDone()

        // When
        const result = await poleEmploiClient.getWithRetry(
          'offresdemploi/v2/offres/1'
        )

        // Then
        expect(result._isSuccess).to.be.true()
      })
      it("quand c'est une 429, rejette quand ce n'est plus le premier retry", async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.peio.pe-qvr.fr/partenaire')
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/offresdemploi/v2/offres/1')
          .reply(429)
          .isDone()
        nock('https://api.peio.pe-qvr.fr/partenaire')
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/offresdemploi/v2/offres/1')
          .reply(429)
          .isDone()

        // When
        const result = await poleEmploiClient.getWithRetry(
          'offresdemploi/v2/offres/1'
        )

        // Then
        expect(result).to.deep.equal(
          failure(new ErreurHttp('Erreur API POLE EMPLOI', 429))
        )
      })
      it('throw une erreur pour un retour http supérieur à 500', async () => {
        // Given
        const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
          minutes: 20
        })
        poleEmploiClient.inMemoryToken = {
          token: 'test-token',
          tokenDate: uneDatetimeDeMoinsDe25Minutes
        }

        nock('https://api.peio.pe-qvr.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(500)
          .isDone()

        await expect(
          poleEmploiClient.getWithRetry('offresdemploi/v2/offres/1')
        ).to.be.rejected()
      })
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

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(200, uneOffreEmploiDto())
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffreEmploi('1')

      // Then
      expect(offreEmploi).to.deep.equal(success(uneOffreEmploiDto()))
    })
    it("undefiend quand l'offre n'existe pas", async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(400)
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffreEmploi('1')

      // Then
      expect(offreEmploi).to.deep.equal(success(undefined))
    })
    it("undefiend quand l'offre n'existe pas (204)", async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(204)
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffreEmploi('1')

      // Then
      expect(offreEmploi).to.deep.equal(success(''))
    })
    it('failure quand la récupération est en erreur', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(401)
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffreEmploi('1')

      // Then
      expect(offreEmploi).to.deep.equal(
        failure(new ErreurHttp('Erreur API POLE EMPLOI', 401))
      )
    })
  })
  describe('getOffresEmploi', () => {
    it('récupère les offres demandées', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get('/offresdemploi/v2/offres/search?param=value')
        .reply(
          200,
          { resultats: [uneOffreEmploiDto()] },
          { 'content-range': 'offres 0-149/1811' }
        )
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffresEmploi(
        new URLSearchParams({ param: 'value' })
      )

      // Then
      expect(offreEmploi).to.deep.equal(
        success({
          total: 1811,
          resultats: [uneOffreEmploiDto()]
        })
      )
    })
    it('renvoie un tableau vide quand il y a une 204', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get('/offresdemploi/v2/offres/search?param=value')
        .reply(204, undefined, { 'content-range': 'offres 0-149/1811' })
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffresEmploi(
        new URLSearchParams({ param: 'value' })
      )

      // Then
      expect(offreEmploi).to.deep.equal(
        success({
          total: 0,
          resultats: []
        })
      )
    })
  })
  describe('getEvenementsEmploi', () => {
    it('récupère les évènements', async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }
      nock('https://api.peio.pe-qvr.fr/partenaire')
        .post('/evenements/v1/mee/evenements?page=0&size=10')
        .reply(200, { totalElements: 0, content: [] })
        .isDone()

      // When
      const evenementsEmploi = await poleEmploiClient.getEvenementsEmploi({
        page: 1,
        limit: 10,
        codePostaux: ['75001']
      })

      // Then
      expect(evenementsEmploi).to.deep.equal(
        success({ totalElements: 0, content: [] })
      )
    })
  })
  describe('getEvenementEmploi', () => {
    it("récupère l'évènement", async () => {
      // Given
      const uneDatetimeDeMoinsDe25Minutes = uneDatetimeDeMaintenant.minus({
        minutes: 20
      })
      poleEmploiClient.inMemoryToken = {
        token: 'test-token',
        tokenDate: uneDatetimeDeMoinsDe25Minutes
      }
      const id = '123'
      nock('https://api.peio.pe-qvr.fr/partenaire')
        .get(`/evenements/v1/mee/evenement/${id}`)
        .reply(200, { id: 123 })
        .isDone()

      // When
      const evenementEmploi = await poleEmploiClient.getEvenementEmploi(id)

      // Then
      expect(evenementEmploi).to.deep.equal(success({ id: 123 }))
    })
  })
  describe('getNotificationsRendezVous', () => {
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

      nock('https://api.peio.pe-qvr.fr/partenaire')
        .post(
          '/listernotificationspartenaires/v1/notifications/partenaires',
          body
        )
        .reply(200, notificationsRDVPEDto())
        .isDone()

      // When
      const notificationsRendezVous =
        await poleEmploiClient.getNotificationsRendezVous(
          [],
          '2020-10-09',
          '2020-10-10'
        )

      // Then
      expect(notificationsRendezVous).to.deep.equal([
        desNotificationsDunJeunePoleEmploi()
      ])
    })
  })
})
