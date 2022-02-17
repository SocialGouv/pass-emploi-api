import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { success } from '../../../src/building-blocks/types/result'
import { GetServicesCiviqueQueryHandler } from 'src/application/queries/get-services-civique.query.handler'
import { ServiceCiviqueQueryModel } from '../../../src/application/queries/query-models/service-civique.query-models'
import { DateTime } from 'luxon'
import { serviceCiviqueQueryModel } from '../../fixtures/query-models/service-civique.query-model.fixtures'

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
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /services-civique', () => {
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
      const expectedQuery = {
        page: '1',
        limit: '50',
        dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        lat: '48.86899229710103',
        lon: '2.3342718577284205',
        distance: '10',
        domaine: 'environnement'
      }

      const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
        serviceCiviqueQueryModel()

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
    ensureUserAuthenticationFailsIfInvalid('get', '/services-civique')
  })
})
