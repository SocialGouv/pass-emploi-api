import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import { expect, StubbedClass } from 'test/utils'
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
import {
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  unAgendaConseillerMiloSessionListItemQueryModel,
  unDetailSessionConseillerMiloQueryModel,
  uneSessionConseillerMiloQueryModel
} from 'test/fixtures/sessions.fixture'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { DateTime } from 'luxon'

describe('ConseillersMiloController', () => {
  let getSessionsQueryHandler: StubbedClass<GetSessionsConseillerMiloQueryHandler>
  let getDetailSessionQueryHandler: StubbedClass<GetDetailSessionConseillerMiloQueryHandler>
  let getAgendaSessionsQueryHandler: StubbedClass<GetAgendaSessionsConseillerMiloQueryHandler>
  let updateSessionCommandHandler: StubbedClass<UpdateSessionMiloCommandHandler>

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    getSessionsQueryHandler = app.get(GetSessionsConseillerMiloQueryHandler)
    getDetailSessionQueryHandler = app.get(
      GetDetailSessionConseillerMiloQueryHandler
    )
    getAgendaSessionsQueryHandler = app.get(
      GetAgendaSessionsConseillerMiloQueryHandler
    )
    updateSessionCommandHandler = app.get(UpdateSessionMiloCommandHandler)
  })

  describe('GET /conseillers/milo/:idConseiller/sessions', () => {
    describe('quand le conseiller a une structure milo renseignée', () => {
      it('renvoie une 200', async () => {
        // Given
        getSessionsQueryHandler.execute.resolves(
          success([uneSessionConseillerMiloQueryModel])
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect([uneSessionConseillerMiloQueryModel])

        expect(
          getSessionsQueryHandler.execute
        ).to.have.been.calledOnceWithExactly(
          {
            idConseiller: 'id-conseiller',
            accessToken: 'coucou',
            dateDebut: undefined,
            dateFin: undefined,
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
      getDetailSessionQueryHandler.execute.resolves(
        success(unDetailSessionConseillerMiloQueryModel)
      )

      // When - Then
      await request(app.getHttpServer())
        .get(`/conseillers/milo/id-conseiller/sessions/${idSession}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(unDetailSessionConseillerMiloQueryModel)

      expect(
        getDetailSessionQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idSession,
          idConseiller: 'id-conseiller',
          accessToken: 'coucou'
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/sessions'
    )
  })

  describe('GET /conseillers/milo/:idConseiller/agenda/sessions', () => {
    it('renvoie une 200 quand tout va bien', async () => {
      // Given
      getAgendaSessionsQueryHandler.execute.resolves(
        success([unAgendaConseillerMiloSessionListItemQueryModel])
      )

      // When - Then
      await request(app.getHttpServer())
        .get(
          `/conseillers/milo/id-conseiller/agenda/sessions?dateDebut=2023-01-01&dateFin=2023-01-08`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect([unAgendaConseillerMiloSessionListItemQueryModel])

      expect(
        getAgendaSessionsQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idConseiller: 'id-conseiller',
          accessToken: 'coucou',
          dateDebut: DateTime.fromISO('2023-01-01'),
          dateFin: DateTime.fromISO('2023-01-08')
        },
        unUtilisateurDecode()
      )
    })

    it('renvoie une 404 quand quelque chose se passe mal', async () => {
      // Given
      getAgendaSessionsQueryHandler.execute.resolves(
        failure(new ErreurHttp('Ressource Milo introuvable', 404))
      )

      // When - Then
      await request(app.getHttpServer())
        .get(
          `/conseillers/milo/id-conseiller/agenda/sessions?dateDebut=2023-01-01&dateFin=2023-01-08`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.NOT_FOUND)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/agenda/sessions'
    )
  })

  describe('PATCH /conseillers/milo/:idConseiller/sessions/:idSession', () => {
    it('met à jour a visibilite', async () => {
      // Given
      const idSession = '123'
      const idConseiller = 'id-conseiller'

      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idConseiller: idConseiller,
        idSession: idSession,
        accessToken: 'coucou',
        inscriptions: undefined
      }

      updateSessionCommandHandler.execute
        .withArgs(command, unUtilisateurDecode())
        .resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .patch(`/conseillers/milo/${idConseiller}/sessions/${idSession}`)
        .send({
          estVisible: true
        })
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)

      expect(
        updateSessionCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command, unUtilisateurDecode())
    })

    it('inscrit des jeunes à une session milo', async () => {
      // Given
      const listeInscrits = [
        {
          idJeune: 'jeune-1',
          statut: SessionMilo.Modification.StatutInscription.INSCRIT
        },
        {
          idJeune: 'jeune-2',
          statut: SessionMilo.Modification.StatutInscription.REFUS_JEUNE,
          commentaire: 'J’ai pas envie'
        },
        {
          idJeune: 'jeune-3',
          statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
        }
      ]
      const idSession = '123'
      const idConseiller = 'id-conseiller'

      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idConseiller: idConseiller,
        idSession: idSession,
        accessToken: 'coucou',
        inscriptions: listeInscrits
      }

      updateSessionCommandHandler.execute
        .withArgs(command, unUtilisateurDecode())
        .resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .patch(`/conseillers/milo/${idConseiller}/sessions/${idSession}`)
        .send({
          estVisible: true,
          inscriptions: listeInscrits
        })
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)

      expect(
        updateSessionCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command, unUtilisateurDecode())
    })

    ensureUserAuthenticationFailsIfInvalid(
      'patch',
      '/conseillers/milo/1/sessions/id-session'
    )
  })
})
