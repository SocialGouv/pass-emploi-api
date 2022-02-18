import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { failure, success } from '../../../src/building-blocks/types/result'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from 'src/application/queries/get-services-civique.query.handler'
import { OffreEngagementQueryModel } from '../../../src/application/queries/query-models/service-civique.query-models'
import { DateTime } from 'luxon'
import { offreEngagementQueryModel } from '../../fixtures/query-models/offre-engagement.query-model.fixtures'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'

describe('ServicesCiviqueController', () => {
  let getServicesCiviqueQueryHandler: StubbedClass<GetServicesCiviqueQueryHandler>
  let app: INestApplication

  before(async () => {
    getServicesCiviqueQueryHandler = stubClass(GetServicesCiviqueQueryHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetServicesCiviqueQueryHandler)
      .useValue(getServicesCiviqueQueryHandler)
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
      it("fait appel à l'API services civique avec les bons paramètres", async () => {
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
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement'
        }

        const serviceCiviqueQueryModels: OffreEngagementQueryModel[] =
          offreEngagementQueryModel()

        getServicesCiviqueQueryHandler.execute.resolves(
          success(serviceCiviqueQueryModels)
        )

        // When
        await request(app.getHttpServer())
          .get('/services-civique')
          .set('authorization', unHeaderAuthorization())
          .query(findServicesCiviqueQuery)
          // Then
          .expect(HttpStatus.OK)

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
})
