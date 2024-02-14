import { HttpStatus, INestApplication } from '@nestjs/common'
import { expect } from 'chai'
import { GetEvenementsEmploiQueryHandler } from 'src/application/queries/get-evenements-emploi.query.handler'
import * as request from 'supertest'
import {
  EvenementEmploiDetailQueryModel,
  GetEvenementEmploiQueryHandler
} from '../../../src/application/queries/get-evenement-emploi.query.handler'
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
  let getEvenementEmploiQueryHandler: StubbedClass<GetEvenementEmploiQueryHandler>
  let app: INestApplication
  let jwtService: StubbedClass<JwtService>

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getEvenementsEmploiQueryHandler = app.get(GetEvenementsEmploiQueryHandler)
    getEvenementEmploiQueryHandler = app.get(GetEvenementEmploiQueryHandler)
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
        codePostal: '75012'
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
          typeEvenement: undefined,
          modalite: undefined
        })
        .resolves(success(result))

      // When
      await request(app.getHttpServer())
        .get('/evenements-emploi')
        .set('authorization', unHeaderAuthorization())
        .query(queryParams)
        // Then
        .expect(HttpStatus.OK)

      expect(getEvenementsEmploiQueryHandler.execute).to.have.been.calledOnce()
    })
  })
  ensureUserAuthenticationFailsIfInvalid('GET', '/evenements-emploi')

  describe('GET /evenements-emploi/id', () => {
    it("retourne le detail de l'evenement quand tout va bien", async () => {
      // Given
      const idEvenement = '123'
      const evenementQueryModel: EvenementEmploiDetailQueryModel = {
        id: idEvenement,
        dateTimeDebut: '2023-05-17T07:00:00.000Z',
        dateTimeFin: '2023-05-16T22:09:00.000Z'
      }
      getEvenementEmploiQueryHandler.execute.resolves(
        success(evenementQueryModel)
      )

      // When
      await request(app.getHttpServer())
        .get('/evenements-emploi/123')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)

      expect(
        getEvenementEmploiQueryHandler.execute
      ).to.have.been.calledOnceWith({
        idEvenement
      })
    })
  })
  ensureUserAuthenticationFailsIfInvalid('GET', '/evenements-emploi/123')
})
