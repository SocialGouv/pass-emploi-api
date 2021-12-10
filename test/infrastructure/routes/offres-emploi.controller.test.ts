import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { GetOffresEmploiQueryHandler } from '../../../src/application/queries/get-offres-emploi.query.handler'
import { Contrat, Duree, Experience } from '../../../src/domain/offre-emploi'
import { uneOffreEmploiResumeQueryModel } from '../../fixtures/offre-emploi.fixture'
import {
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from '../../../src/application/queries/query-models/offres-emploi.query-models'
import { FindOffresEmploiQuery } from '../../../src/infrastructure/routes/validation/offres-emploi.inputs'
import {
  GetDetailOffreEmploiQuery,
  GetDetailOffreEmploiQueryHandler
} from '../../../src/application/queries/get-detail-offre-emploi.query.handler'

describe('OffresEmploiController', () => {
  let getOffresEmploiQueryHandler: StubbedClass<GetOffresEmploiQueryHandler>
  let getDetailOffreEmploiQueryHandler: StubbedClass<GetDetailOffreEmploiQueryHandler>
  let app: INestApplication

  before(async () => {
    getOffresEmploiQueryHandler = stubClass(GetOffresEmploiQueryHandler)
    getDetailOffreEmploiQueryHandler = stubClass(
      GetDetailOffreEmploiQueryHandler
    )
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetOffresEmploiQueryHandler)
      .useValue(getOffresEmploiQueryHandler)
      .overrideProvider(GetDetailOffreEmploiQueryHandler)
      .useValue(getDetailOffreEmploiQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /offres-emploi', () => {
    it("fait appel à l'API Pôle Emploi avec les bons paramètres", async () => {
      // Given
      const findOffresEmploiQuery: FindOffresEmploiQuery = {
        page: 1,
        limit: 50,
        q: 'informatique',
        departement: undefined,
        alternance: true,
        experience: [Experience.moinsdUnAn],
        contrat: [Contrat.cdi, Contrat.cdd],
        duree: [Duree.tempsPartiel],
        rayon: 0,
        commune: '75118'
      }
      const expectedQuery = {
        page: '1',
        limit: '50',
        query: 'informatique',
        departement: undefined,
        alternance: 'true',
        experience: '1',
        contrat: ['CDI', 'CDD-interim-saisonnier'],
        duree: '2',
        rayon: '0',
        commune: '75118'
      }

      const offresEmploiQueryModel: OffresEmploiQueryModel = {
        pagination: {
          page: 1,
          limit: 50
        },
        results: [uneOffreEmploiResumeQueryModel()]
      }

      getOffresEmploiQueryHandler.execute.resolves(offresEmploiQueryModel)

      // When
      await request(app.getHttpServer())
        .get('/offres-emploi')
        .query(findOffresEmploiQuery)
        // Then
        .expect(HttpStatus.OK)

      expect(getOffresEmploiQueryHandler.execute).to.have.been.calledWith(
        expectedQuery
      )
    })
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
        .resolves(offreEmploiQueryModel)

      // When
      await request(app.getHttpServer())
        .get(`/offres-emploi/${query.idOffreEmploi}`)
        // Then
        .expect(HttpStatus.OK)
        .expect(offreEmploiQueryModel)
    })
    it("renvoit une 404 si l'offre n'existe pas", async () => {
      // Given
      getDetailOffreEmploiQueryHandler.execute
        .withArgs(query)
        .resolves(undefined)

      const expectedResponseJson = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Offre d'emploi ${query.idOffreEmploi} not found`
      }
      // When
      await request(app.getHttpServer())
        .get(`/offres-emploi/${query.idOffreEmploi}`)
        // Then
        .expect(expectedResponseJson)
    })
  })
})
