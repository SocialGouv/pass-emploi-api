import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from 'src/application/queries/get-services-civique.query.handler'
import * as request from 'supertest'
import {
  GetDetailOffreServiceCiviqueQuery,
  GetDetailServiceCiviqueQueryHandler
} from '../../../src/application/queries/get-detail-service-civique.query.handler'
import {
  DetailServiceCiviqueQueryModel,
  ServiceCiviqueQueryModel
} from '../../../src/application/queries/query-models/service-civique.query-model'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  offresServicesCiviqueQueryModel,
  unDetailOffreServiceCiviqueQuerymodel
} from '../../fixtures/query-models/offre-service-civique.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('ServicesCiviqueController', () => {
  let getServicesCiviqueQueryHandler: StubbedClass<GetServicesCiviqueQueryHandler>
  let getDetailServiceCiviqueQueryHandler: StubbedClass<GetDetailServiceCiviqueQueryHandler>
  let app: INestApplication

  before(async () => {
    getServicesCiviqueQueryHandler = stubClass(GetServicesCiviqueQueryHandler)
    getDetailServiceCiviqueQueryHandler = stubClass(
      GetDetailServiceCiviqueQueryHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetServicesCiviqueQueryHandler)
      .useValue(getServicesCiviqueQueryHandler)
      .overrideProvider(GetDetailServiceCiviqueQueryHandler)
      .useValue(getDetailServiceCiviqueQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /services-civique', () => {
    describe('quand tout va bien', () => {
      it('recherche les services civiques et les renvoie tels quels', async () => {
        // Given
        const findServicesCiviqueQuery = {
          page: '1',
          limit: '50',
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          lat: '48.86899229710103',
          lon: '2.3342718577284205',
          distance: '10',
          domaine: 'environnement'
        }
        const expectedQuery: GetServicesCiviqueQuery = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement'
        }

        const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
          offresServicesCiviqueQueryModel()

        getServicesCiviqueQueryHandler.execute.resolves(
          success({
            pagination: { total: serviceCiviqueQueryModels.length },
            results: serviceCiviqueQueryModels
          })
        )

        // When
        await request(app.getHttpServer())
          .get('/services-civique')
          .set('authorization', unHeaderAuthorization())
          .query(findServicesCiviqueQuery)
          // Then
          .expect(HttpStatus.OK)
          .expect(serviceCiviqueQueryModels)

        expect(getServicesCiviqueQueryHandler.execute).to.have.been.calledWith(
          expectedQuery
        )
      })
    })

    describe('quand il y a une failure http', () => {
      it('retourne une erreur http', async () => {
        // Given
        const findServicesCiviqueQuery = {
          page: '1',
          limit: '50',
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          lat: '48.86899229710103',
          lon: '2.3342718577284205',
          distance: '10',
          domaine: 'environnement'
        }

        getServicesCiviqueQueryHandler.execute.resolves(
          failure(new ErreurHttp('Bad request', 400))
        )

        // When
        await request(app.getHttpServer())
          .get('/services-civique')
          .set('authorization', unHeaderAuthorization())
          .query(findServicesCiviqueQuery)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/services-civique')
  })

  describe('GET /v2/services-civique', () => {
    describe('quand tout va bien', () => {
      it('recherche les services civiques et les renvoie avec les info de pagination', async () => {
        // Given
        const findServicesCiviqueQuery = {
          page: '1',
          limit: '50',
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          lat: '48.86899229710103',
          lon: '2.3342718577284205',
          distance: '10',
          domaine: 'environnement'
        }
        const expectedQuery: GetServicesCiviqueQuery = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement'
        }

        const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
          offresServicesCiviqueQueryModel()

        getServicesCiviqueQueryHandler.execute.resolves(
          success({
            pagination: { total: serviceCiviqueQueryModels.length },
            results: serviceCiviqueQueryModels
          })
        )

        // When
        await request(app.getHttpServer())
          .get('/v2/services-civique')
          .set('authorization', unHeaderAuthorization())
          .query({ ...findServicesCiviqueQuery, avecDonneesPagination: true })
          // Then
          .expect(HttpStatus.OK)
          .expect({
            pagination: { total: 1 },
            results: serviceCiviqueQueryModels
          })

        expect(getServicesCiviqueQueryHandler.execute).to.have.been.calledWith(
          expectedQuery
        )
      })
    })

    describe('quand il y a une failure http', () => {
      it('retourne une erreur http', async () => {
        // Given
        const findServicesCiviqueQuery = {
          page: '1',
          limit: '50',
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          lat: '48.86899229710103',
          lon: '2.3342718577284205',
          distance: '10',
          domaine: 'environnement'
        }

        getServicesCiviqueQueryHandler.execute.resolves(
          failure(new ErreurHttp('Bad request', 400))
        )

        // When
        await request(app.getHttpServer())
          .get('/v2/services-civique')
          .set('authorization', unHeaderAuthorization())
          .query(findServicesCiviqueQuery)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/v2/services-civique')
  })

  describe('GET /services-civique/:idOffreEngagement', () => {
    const query: GetDetailOffreServiceCiviqueQuery = {
      idOffre: '1'
    }
    describe('quand tout va bien', () => {
      it("fait appel à l'API services civique avec les bons paramètres", async () => {
        // Given
        const detailOffreEngagementQueryModel: DetailServiceCiviqueQueryModel =
          unDetailOffreServiceCiviqueQuerymodel()

        getDetailServiceCiviqueQueryHandler.execute.resolves(
          success(detailOffreEngagementQueryModel)
        )

        // When
        await request(app.getHttpServer())
          .get(`/services-civique/${query.idOffre}`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)
      })
    })
    describe('quand il y a une failure http', () => {
      it('retourne une erreur http', async () => {
        // Given
        getDetailServiceCiviqueQueryHandler.execute.resolves(
          failure(new ErreurHttp('Bad request', 400))
        )

        // When
        await request(app.getHttpServer())
          .get(`/services-civique/${query.idOffre}`)
          .set('authorization', unHeaderAuthorization())

          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    describe('quand l"offre n"existe pas', () => {
      it('retourne une erreur not found', async () => {
        // Given
        getDetailServiceCiviqueQueryHandler.execute.resolves(
          failure(new NonTrouveError('OffreServiceCivique', query.idOffre))
        )

        // When
        await request(app.getHttpServer())
          .get(`/services-civique/${query.idOffre}`)
          .set('authorization', unHeaderAuthorization())

          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/services-civique/123')
  })
})
