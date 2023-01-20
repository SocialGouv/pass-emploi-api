import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../utils'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../../src/application/queries/get-offres-emploi.query.handler'
import { uneOffreEmploiResumeQueryModel } from '../../fixtures/offre-emploi.fixture'
import {
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from '../../../src/application/queries/query-models/offres-emploi.query-model'
import {
  GetDetailOffreEmploiQuery,
  GetDetailOffreEmploiQueryHandler
} from '../../../src/application/queries/get-detail-offre-emploi.query.handler'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { failure, success } from '../../../src/building-blocks/types/result'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { Offre } from '../../../src/domain/offre/offre'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('OffresEmploiController', () => {
  let getOffresEmploiQueryHandler: StubbedClass<GetOffresEmploiQueryHandler>
  let getDetailOffreEmploiQueryHandler: StubbedClass<GetDetailOffreEmploiQueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getOffresEmploiQueryHandler = app.get(GetOffresEmploiQueryHandler)
    getDetailOffreEmploiQueryHandler = app.get(GetDetailOffreEmploiQueryHandler)
  })

  describe('GET /offres-emploi', () => {
    describe('quand tout va bien', () => {
      it("fait appel à l'API Pôle Emploi avec les bons paramètres", async () => {
        // Given
        const findOffresEmploiQuery = {
          page: '1',
          limit: '50',
          q: 'informatique',
          alternance: 'true',
          experience: [Offre.Emploi.Experience.moinsdUnAn],
          debutantAccepte: 'true',
          contrat: [Offre.Emploi.Contrat.cdi, Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPartiel],
          rayon: '10',
          commune: '75118'
        }
        const expectedQuery: GetOffresEmploiQuery = {
          page: 1,
          limit: 50,
          q: 'informatique',
          departement: undefined,
          alternance: true,
          experience: [Offre.Emploi.Experience.moinsdUnAn],
          debutantAccepte: true,
          contrat: [Offre.Emploi.Contrat.cdi, Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPartiel],
          rayon: 10,
          commune: '75118'
        }

        const offresEmploiQueryModel: OffresEmploiQueryModel = {
          pagination: {
            page: 1,
            limit: 50,
            total: 1
          },
          results: [uneOffreEmploiResumeQueryModel()]
        }

        getOffresEmploiQueryHandler.execute.resolves(
          success(offresEmploiQueryModel)
        )

        // When
        await request(app.getHttpServer())
          .get('/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .query(findOffresEmploiQuery)
          // Then
          .expect(HttpStatus.OK)

        expect(getOffresEmploiQueryHandler.execute).to.have.been.calledWith(
          expectedQuery
        )
      })
    })
    describe('quand il y a une erreur', () => {
      it('renvoie le code http idoine', async () => {
        // Given
        const findOffresEmploiQuery = {
          page: '1',
          limit: '50',
          q: 'informatique',
          alternance: 'true',
          experience: [Offre.Emploi.Experience.moinsdUnAn],
          contrat: [Offre.Emploi.Contrat.cdi, Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPartiel],
          rayon: '10',
          commune: '75118'
        }
        getOffresEmploiQueryHandler.execute.resolves(
          failure(new ErreurHttp('Bad request', 400))
        )

        // When
        await request(app.getHttpServer())
          .get('/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .query(findOffresEmploiQuery)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/offres-emploi')
  })
  describe('GET /offres-emploi/:idOffreEmploi', () => {
    const query: GetDetailOffreEmploiQuery = {
      idOffreEmploi: '1'
    }

    it("renvoit l'offre si elle existe", async () => {
      // Given
      const offreEmploiQueryModel: OffreEmploiQueryModel = {
        id: '1',
        data: [],
        urlRedirectPourPostulation: ''
      }

      getDetailOffreEmploiQueryHandler.execute
        .withArgs(query)
        .resolves(success(offreEmploiQueryModel))

      // When
      await request(app.getHttpServer())
        .get(`/offres-emploi/${query.idOffreEmploi}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(offreEmploiQueryModel)
    })
    it("renvoit une 404 si l'offre n'existe pas", async () => {
      // Given
      getDetailOffreEmploiQueryHandler.execute
        .withArgs(query)
        .resolves(
          failure(new NonTrouveError("Offre d'emploi", query.idOffreEmploi))
        )

      const expectedResponseJson = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Offre d'emploi ${query.idOffreEmploi} non trouvé(e)`,
        error: 'Not Found'
      }
      // When
      await request(app.getHttpServer())
        .get(`/offres-emploi/${query.idOffreEmploi}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedResponseJson)
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/offres-emploi/123')
  })
})
