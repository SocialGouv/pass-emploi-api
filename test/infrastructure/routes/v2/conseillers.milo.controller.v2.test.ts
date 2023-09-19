import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { expect, StubbedClass } from 'test/utils'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { failure, success } from 'src/building-blocks/types/result'
import * as request from 'supertest'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { uneSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { GetSessionsConseillerMiloV2QueryHandler } from 'src/application/queries/milo/v2/get-sessions-conseiller.milo.v2.query.handler.db'

describe('ConseillersMiloControllerV2', () => {
  let getSessionsQueryHandler: StubbedClass<GetSessionsConseillerMiloV2QueryHandler>

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    getSessionsQueryHandler = app.get(GetSessionsConseillerMiloV2QueryHandler)
  })

  describe('GET /v2/conseillers/milo/:idConseiller/sessions', () => {
    describe('quand le conseiller a une structure milo renseignée', () => {
      it('renvoie une 200', async () => {
        // Given
        const response = {
          pagination: {
            page: 1,
            limit: 10,
            total: 1
          },
          resultats: [uneSessionConseillerMiloQueryModel]
        }
        getSessionsQueryHandler.execute.resolves(success(response))

        // When - Then
        await request(app.getHttpServer())
          .get('/v2/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(response)

        expect(
          getSessionsQueryHandler.execute
        ).to.have.been.calledOnceWithExactly(
          {
            idConseiller: 'id-conseiller',
            accessToken: 'coucou',
            page: undefined,
            filtrerAClore: undefined
          },
          unUtilisateurDecode()
        )
      })
    })

    describe('quand le conseiller n’a pas de structure milo renseignée', () => {
      it('renvoie une 404', async () => {
        // Given
        getSessionsQueryHandler.execute.resolves(
          failure(new NonTrouveError('Conseiller Milo', 'id-conseiller'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/v2/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/v2/conseillers/milo/1/sessions'
    )
  })
})
