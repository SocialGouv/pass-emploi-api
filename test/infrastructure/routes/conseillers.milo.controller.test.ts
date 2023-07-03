import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { GetSessionsMiloQueryHandler } from 'src/application/queries/milo/get-sessions.milo.query.handler.db'
import { StubbedClass, expect } from 'test/utils'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import * as request from 'supertest'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import {
  unDetailSessionConseillerMiloQueryModel,
  uneSessionConseillerMiloQueryModel
} from 'test/fixtures/sessions.fixture'
import { GetDetailSessionMiloQueryHandler } from 'src/application/queries/milo/get-detail-session.milo.query.handler.db'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'

describe('ConseillersMiloController', () => {
  let getSessionsMiloQueryHandler: StubbedClass<GetSessionsMiloQueryHandler>
  let getDetailSessionMiloQueryHandler: StubbedClass<GetDetailSessionMiloQueryHandler>
  let updateVisibiliteSessionCommandHandler: StubbedClass<UpdateSessionMiloCommandHandler>

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    getSessionsMiloQueryHandler = app.get(GetSessionsMiloQueryHandler)
    getDetailSessionMiloQueryHandler = app.get(GetDetailSessionMiloQueryHandler)
    updateVisibiliteSessionCommandHandler = app.get(
      UpdateSessionMiloCommandHandler
    )
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
            token: 'coucou',
            dateDebut: undefined,
            dateFin: undefined
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

  describe('GET /conseillers/milo/:idConseiller/sessions/:idSession', () => {
    it('renvoie une 200 quand tout va bien', async () => {
      // Given
      const idSession = '123'
      getDetailSessionMiloQueryHandler.execute.resolves(
        success(unDetailSessionConseillerMiloQueryModel())
      )

      // When - Then
      await request(app.getHttpServer())
        .get(`/conseillers/milo/id-conseiller/sessions/${idSession}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(unDetailSessionConseillerMiloQueryModel())

      expect(
        getDetailSessionMiloQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idSession,
          idConseiller: 'id-conseiller',
          token: 'coucou'
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/sessions'
    )
  })

  describe('PUT /conseillers/milo/:idConseiller/sessions/:idSession', () => {
    it('met à jour a visibilite', async () => {
      // Given
      const idSession = '123'
      const idConseiller = 'id-conseiller'

      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idConseiller: idConseiller,
        idSession: idSession,
        token: 'coucou'
      }

      updateVisibiliteSessionCommandHandler.execute
        .withArgs(command, unUtilisateurDecode())
        .resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .put(`/conseillers/milo/${idConseiller}/sessions/${idSession}`)
        .send({
          estVisible: true
        })
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)

      expect(
        updateVisibiliteSessionCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command, unUtilisateurDecode())
    })
    ensureUserAuthenticationFailsIfInvalid(
      'put',
      '/conseillers/milo/1/sessions/id-session'
    )
  })
})
