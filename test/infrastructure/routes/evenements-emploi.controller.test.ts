import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unJwtPayloadValide
} from '../../fixtures/authentification.fixture'
import { StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import {
  GetEvenementsEmploiQuery,
  GetEvenementsEmploiQueryHandler
} from 'src/application/queries/get-evenements-emploi.query.handler'
import { EvenementsEmploiQueryModel } from 'src/application/queries/query-models/evenements-emploi.query-model'

describe('EvenementsEmploiController', () => {
  let getEvenementsEmploiQueryHandler: StubbedClass<GetEvenementsEmploiQueryHandler>
  let app: INestApplication
  let jwtService: StubbedClass<JwtService>

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getEvenementsEmploiQueryHandler = app.get(GetEvenementsEmploiQueryHandler)
    jwtService = app.get(JwtService)
  })
  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  describe('POST /evenements-emploi', () => {
    describe('Quand tout est OK', () => {
      it("Fait appel à l'API Evenements Emploi avec les bons paramètres", async () => {
        // Given
        const query: GetEvenementsEmploiQuery = {
          page: 1,
          limit: 10,
          codePostal: '75009'
        }

        const results: EvenementsEmploiQueryModel = {
          pagination: {
            page: 1,
            limit: 10,
            total: 1
          },
          results: []
        }

        getEvenementsEmploiQueryHandler.execute.resolves(results)

        // When
        await request(app.getHttpServer())
          .get('/evenements-emploi')
          .set('authorization', unHeaderAuthorization())
          .query(query)
          // Then
          .expect(HttpStatus.OK)
      })
    })
  })
  ensureUserAuthenticationFailsIfInvalid('get', '/evenements-emploi')
})
