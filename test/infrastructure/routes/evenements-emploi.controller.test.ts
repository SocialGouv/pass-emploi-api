import { HttpStatus, INestApplication } from '@nestjs/common'
import { GetEvenementsEmploiQueryHandler } from 'src/application/queries/get-evenements-emploi.query.handler'
import * as request from 'supertest'
import { success } from '../../../src/building-blocks/types/result'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import { FindEvenementsEmploiQueryParams } from '../../../src/infrastructure/routes/validation/evenements-emploi.inputs'
import {
  unHeaderAuthorization,
  unJwtPayloadValide
} from '../../fixtures/authentification.fixture'
import { StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

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

  describe('GET /evenements-emploi', () => {
    it('retourne le résultat quand tout va bien', async () => {
      // Given
      const queryParams: FindEvenementsEmploiQueryParams = {
        page: 1,
        limit: 10,
        codePostal: 75012
      }

      const result = {
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        },
        results: []
      }

      getEvenementsEmploiQueryHandler.execute
        .withArgs({
          ...queryParams,
          secteurActivite: undefined,
          dateDebut: undefined,
          dateFin: undefined,
          typeEvenement: undefined
        })
        .resolves(success(result))

      // When
      await request(app.getHttpServer())
        .get('/evenements-emploi')
        .set('authorization', unHeaderAuthorization())
        .query(queryParams)
        // Then
        .expect(HttpStatus.OK)
    })
  })
  ensureUserAuthenticationFailsIfInvalid('GET', '/evenements-emploi')
})
