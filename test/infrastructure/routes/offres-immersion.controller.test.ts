import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { EnvoyerFormulaireContactImmersionCommandHandler } from '../../../src/application/commands/immersion/envoyer-formulaire-contact-immersion.command.handler'
import {
  NotifierNouvellesImmersionsCommand,
  NotifierNouvellesImmersionsCommandHandler
} from '../../../src/application/commands/notifier-nouvelles-immersions.command.handler'
import {
  GetDetailOffreImmersionQuery,
  GetDetailOffreImmersionQueryHandler
} from '../../../src/application/queries/get-detail-offre-immersion.query.handler'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../../src/application/queries/get-offres-immersion.query.handler'
import {
  DetailOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from '../../../src/application/queries/query-models/offres-immersion.query-model'
import {
  ErreurHttp,
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve,
  RechercheOffreInvalide
} from '../../../src/building-blocks/types/domain-error'

import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { StubbedClass, expect } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('OffresImmersionController', () => {
  let getOffresImmersionQueryHandler: StubbedClass<GetOffresImmersionQueryHandler>
  let getDetailOffreImmersionQueryHandler: StubbedClass<GetDetailOffreImmersionQueryHandler>
  let notifierNouvellesImmersionsCommandHandler: StubbedClass<NotifierNouvellesImmersionsCommandHandler>
  let envoyerFormulaireContactImmersionCommandHandler: StubbedClass<EnvoyerFormulaireContactImmersionCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getOffresImmersionQueryHandler = app.get(GetOffresImmersionQueryHandler)
    getDetailOffreImmersionQueryHandler = app.get(
      GetDetailOffreImmersionQueryHandler
    )
    notifierNouvellesImmersionsCommandHandler = app.get(
      NotifierNouvellesImmersionsCommandHandler
    )
    envoyerFormulaireContactImmersionCommandHandler = app.get(
      EnvoyerFormulaireContactImmersionCommandHandler
    )
  })

  describe('GET /offres-immersion', () => {
    describe('quand tout va bien', () => {
      it("fait appel à l'API Immersion avec les bons paramètres", async () => {
        // Given
        const getOffresImmersionQuery: GetOffresImmersionQuery = {
          rome: 'D1102',
          lat: 48.502103949334845,
          lon: 2.13082255225161
        }

        const offresImmersionQueryModel: OffreImmersionQueryModel[] = [
          {
            id: '1',
            metier: 'Boulanger',
            nomEtablissement: 'Boulangerie',
            secteurActivite: 'Restauration',
            ville: 'Paris',
            estVolontaire: true
          }
        ]

        getOffresImmersionQueryHandler.execute.resolves(
          success(offresImmersionQueryModel)
        )

        // When
        const result = await request(app.getHttpServer())
          .get('/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .query(getOffresImmersionQuery)
          // Then
          .expect(HttpStatus.OK)

        expect(result.body).to.deep.equal(offresImmersionQueryModel)
      })
    })
    describe('quand la requête est mauvaise', () => {
      it("renvoie un message d'erreur", async () => {
        // Given
        const getOffresImmersionQuery: GetOffresImmersionQuery = {
          rome: 'D1102',
          lat: 48.502103949334845,
          lon: 2.13082255225161
        }

        getOffresImmersionQueryHandler.execute.resolves(
          failure(new RechercheOffreInvalide('Les champs sont pas bons'))
        )

        // When
        await request(app.getHttpServer())
          .get('/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .query(getOffresImmersionQuery)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/offres-immersion')
  })
  describe('GET /offres-immersion/:idOffreImmersion', () => {
    const query: GetDetailOffreImmersionQuery = {
      idOffreImmersion: '1'
    }
    describe('quand tout va bien', () => {
      it('renvoie la bonne offre recherchée', async () => {
        // Given
        const detailOffreImmersionQueryModel: DetailOffreImmersionQueryModel = {
          adresse: 'addresse',
          estVolontaire: true,
          id: '1',
          metier: 'rome',
          nomEtablissement: 'name',
          secteurActivite: 'naf',
          ville: 'Paris',
          codeRome: 'rome',
          siret: 'siret'
        }
        getDetailOffreImmersionQueryHandler.execute
          .withArgs(query)
          .resolves(success(detailOffreImmersionQueryModel))

        // When
        const result = await request(app.getHttpServer())
          .get(`/offres-immersion/${query.idOffreImmersion}`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)

        expect(result.body).to.deep.equal(detailOffreImmersionQueryModel)
      })
    })
    describe('quand la requête est mauvaise', () => {
      it('renvoit une erreur de type BAD_REQUEST', async () => {
        // Given
        getDetailOffreImmersionQueryHandler.execute
          .withArgs(query)
          .resolves(
            failure(
              new RechercheDetailOffreInvalide("La recherche n'est pas bonne")
            )
          )

        // When
        await request(app.getHttpServer())
          .get(`/offres-immersion/${query.idOffreImmersion}`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    describe("quand l'offre est introuvable", () => {
      it('renvoit une erreur de type NOT_FOUND', async () => {
        // Given
        getDetailOffreImmersionQueryHandler.execute
          .withArgs(query)
          .resolves(
            failure(new RechercheDetailOffreNonTrouve('Offre introuvable'))
          )

        // When
        await request(app.getHttpServer())
          .get(`/offres-immersion/${query.idOffreImmersion}`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/offres-immersion/1')
  })
  describe('POST /offres-immersion', () => {
    // Given
    const uneNouvelleImmersion: NotifierNouvellesImmersionsCommand = {
      immersions: [
        {
          rome: 'unRome',
          location: {
            lon: 1.2,
            lat: 3.4
          },
          siret: '22334343'
        }
      ]
    }
    describe('quand le payload est bon', () => {
      it('appelle la commande et répond 202', async () => {
        // When
        await request(app.getHttpServer())
          .post('/offres-immersion')
          .send(uneNouvelleImmersion)
          .set({ 'X-API-KEY': 'ceci-est-une-autre-api-key' })
          // Then
          .expect(HttpStatus.ACCEPTED)

        expect(
          notifierNouvellesImmersionsCommandHandler.execute
        ).to.have.been.calledWithExactly(uneNouvelleImmersion)
      })
    })
    describe('quand le payload est pas bon', () => {
      it('répond 400', async () => {
        // When
        await request(app.getHttpServer())
          .post('/offres-immersion')
          .send({ immersions: [{ plop: 'john' }] })
          .set({ 'X-API-KEY': 'ceci-est-une-autre-api-key' })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    describe("quand l'api key est pas bonne", () => {
      it('répond 401', async () => {
        // When
        await request(app.getHttpServer())
          .post('/offres-immersion')
          .send(uneNouvelleImmersion)
          .set({ 'X-API-KEY': 'ceci-est-une-mauvaise-api-key' })
          // Then
          .expect(HttpStatus.UNAUTHORIZED)
      })
    })
  })

  describe('POST /jeunes/:idJeune/offres-immersion/contact', () => {
    it('renvoie un code de succes quand la commande est en succes', async () => {
      // Given
      const payload = {
        idJeune: '1',
        codeRome: 'D1102',
        labelRome: 'Boulangerie - viennoiserie',
        siret: '10226726508419',
        prenom: 'prenom',
        nom: 'nom',
        email: 'test@test.com',
        contactMode: 'PHONE',
        message: 'test'
      }

      envoyerFormulaireContactImmersionCommandHandler.execute
        .withArgs(payload)
        .resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/1/offres-immersion/contact')
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.CREATED)
    })
    it("renvoie le bon code d'erreur quand la commande est en failure", async () => {
      // Given
      const payload = {
        idJeune: '1',
        codeRome: 'D1102',
        labelRome: 'Boulangerie - viennoiserie',
        siret: '10226726508419',
        prenom: 'prenom',
        nom: 'nom',
        email: 'test@test.com',
        contactMode: 'PHONE',
        message: 'test'
      }

      envoyerFormulaireContactImmersionCommandHandler.execute.resolves(
        failure(new ErreurHttp('erreur', 401))
      )

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/1/offres-immersion/contact')
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.UNAUTHORIZED)
    })
    it('renvoie une bad request quand le contact est EMAIL et le message vide', async () => {
      // Given
      const payload = {
        idJeune: '1',
        codeRome: 'D1102',
        labelRome: 'Boulangerie - viennoiserie',
        siret: '10226726508419',
        prenom: 'prenom',
        nom: 'nom',
        email: 'test@test.com',
        contactMode: 'EMAIL',
        message: ''
      }

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/1/offres-immersion/contact')
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/1/offres-immersion/contact'
    )
  })
})
