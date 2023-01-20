import { HttpService } from '@nestjs/axios'
import { DateTime } from 'luxon'
import * as nock from 'nock'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { DateService } from 'src/utils/date-service'
import { RateLimiterService } from 'src/utils/rate-limiter.service'
import { expect, stubClass } from 'test/utils'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import {
  failure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { desNotificationsDunJeunePoleEmploi } from '../../fixtures/notification.fixture'
import {
  notificationsRDVPEDto,
  uneOffreEmploiDto
} from '../../fixtures/offre-emploi.fixture'
import { desTypesDemarchesDto } from '../../fixtures/pole-emploi.dto.fixture'
import { testConfig } from '../../utils/module-for-testing'

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
  describe('get', () => {
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

        nock('https://api.emploi-store.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(200, {
            resultats: []
          })
          .isDone()

        // When
        const result = await poleEmploiClient.get('offresdemploi/v2/offres/1')

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

        nock('https://api.emploi-store.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(400)
          .isDone()

        // When
        const result = await poleEmploiClient.get('offresdemploi/v2/offres/1')

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('erreur', 400)))
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

        nock('https://api.emploi-store.fr/partenaire')
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/offresdemploi/v2/offres/1')
          .reply(429)
          .isDone()
        nock('https://api.emploi-store.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(200)
          .isDone()

        // When
        const result = await poleEmploiClient.get('offresdemploi/v2/offres/1')

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

        nock('https://api.emploi-store.fr/partenaire')
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/offresdemploi/v2/offres/1')
          .reply(429)
          .isDone()
        nock('https://api.emploi-store.fr/partenaire')
          .defaultReplyHeaders({ 'retry-after': '1' })
          .get('/offresdemploi/v2/offres/1')
          .reply(429)
          .isDone()

        // When
        const result = await poleEmploiClient.get('offresdemploi/v2/offres/1')

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('erreur', 429)))
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

        nock('https://api.emploi-store.fr/partenaire')
          .get('/offresdemploi/v2/offres/1')
          .reply(500)
          .isDone()

        await expect(
          poleEmploiClient.get('offresdemploi/v2/offres/1')
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

      nock('https://api.emploi-store.fr/partenaire')
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

      nock('https://api.emploi-store.fr/partenaire')
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

      nock('https://api.emploi-store.fr/partenaire')
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

      nock('https://api.emploi-store.fr/partenaire')
        .get('/offresdemploi/v2/offres/1')
        .reply(401)
        .isDone()

      // When
      const offreEmploi = await poleEmploiClient.getOffreEmploi('1')

      // Then
      expect(offreEmploi).to.deep.equal(failure(new ErreurHttp('erreur', 401)))
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

      nock('https://api.emploi-store.fr/partenaire')
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

      nock('https://api.emploi-store.fr/partenaire')
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

      nock('https://api.emploi-store.fr/partenaire')
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
