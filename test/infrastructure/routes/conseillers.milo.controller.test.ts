import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { GetSessionsMiloQueryHandler } from '../../../src/application/queries/milo/get-sessions.milo.query.handler'
import { StubbedClass, expect } from '../../utils'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import * as request from 'supertest'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { uneSessionConseillerMiloQueryModel } from '../../fixtures/sessions.fixture'

describe('ConseillersMiloController', () => {
  let getSessionsMiloQueryHandler: StubbedClass<GetSessionsMiloQueryHandler>

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    getSessionsMiloQueryHandler = app.get(GetSessionsMiloQueryHandler)
  })

  describe('GET /conseillers/milo/:idConseiller/sessions', () => {
    describe('quand le conseiller a une structure milo renseignée', () => {
      it('renvoie une 200', async () => {
        // Given
        getSessionsMiloQueryHandler.execute.resolves(
          success([uneSessionConseillerMiloQueryModel()])
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect([uneSessionConseillerMiloQueryModel()])

        expect(
          getSessionsMiloQueryHandler.execute
        ).to.have.been.calledOnceWithExactly(
          {
            idConseiller: 'id-conseiller',
            token: 'coucou'
          },
          unUtilisateurDecode()
        )
      })
    })
    describe('quand le conseiller n’a pas de structure milo renseignée', () => {
      it('renvoie une 404', async () => {
        // Given
        getSessionsMiloQueryHandler.execute.resolves(
          failure(new NonTrouveError('Conseiller Milo', 'id-conseiller'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/sessions'
    )
  })
})
