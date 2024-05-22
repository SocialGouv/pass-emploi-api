import { HttpStatus, INestApplication } from '@nestjs/common'

import * as request from 'supertest'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { JwtService } from 'src/infrastructure/auth/jwt.service'
import {
  unJwtPayloadValide,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { StubbedClass } from 'test/utils'

import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { DateService } from 'src/utils/date-service'

import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/milo/get-accueil-jeune-milo.query.handler.db'
import {
  AccueilJeuneMiloQueryModel,
  GetMonSuiviMiloQueryModel
} from 'src/application/queries/query-models/jeunes.milo.query-model'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'
import {
  unDetailSessionJeuneMiloQueryModel,
  uneSessionJeuneMiloQueryModel
} from 'test/fixtures/sessions.fixture'
import { GetDetailSessionJeuneMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-jeune.milo.query.handler.db'
import {
  GetMonSuiviMiloQuery,
  GetMonSuiviMiloQueryHandler
} from '../../../src/application/queries/milo/get-mon-suivi-jeune.milo.query.handler.db'
import { DateTime } from 'luxon'

describe('JeunesMiloController', () => {
  let getAccueilQueryHandler: StubbedClass<GetAccueilJeuneMiloQueryHandler>
  let getSessionsQueryHandler: StubbedClass<GetSessionsJeuneMiloQueryHandler>
  let getDetailSessionQueryHandler: StubbedClass<GetDetailSessionJeuneMiloQueryHandler>
  let monSuiviQueryHandler: StubbedClass<GetMonSuiviMiloQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let dateService: StubbedClass<DateService>
  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAccueilQueryHandler = app.get(GetAccueilJeuneMiloQueryHandler)
    getSessionsQueryHandler = app.get(GetSessionsJeuneMiloQueryHandler)
    getDetailSessionQueryHandler = app.get(
      GetDetailSessionJeuneMiloQueryHandler
    )
    monSuiviQueryHandler = app.get(GetMonSuiviMiloQueryHandler)
    jwtService = app.get(JwtService)
    dateService = app.get(DateService)
    dateService.now.returns(now)
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  describe('GET /jeunes/:idJeune/milo/accueil', () => {
    const idJeune = '1'
    const maintenant = '2023-03-03'
    const token = 'token'
    const accueilJeuneQueryModel: AccueilJeuneMiloQueryModel = {
      cetteSemaine: {
        nombreRendezVous: 1,
        nombreActionsDemarchesEnRetard: 1,
        nombreActionsDemarchesARealiser: 1,
        nombreActionsDemarchesAFaireSemaineCalendaire: 1
      },
      prochainRendezVous: undefined,
      evenementsAVenir: [],
      sessionsMiloAVenir: [],
      mesAlertes: [],
      mesFavoris: []
    }

    it("renvoie l'accueil d'un jeune MILO sans personnalisation", async () => {
      getAccueilQueryHandler.execute
        .withArgs(
          { idJeune, maintenant, accessToken: token },
          unUtilisateurDecode()
        )
        .resolves(success(accueilJeuneQueryModel))
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        prochainRendezVous,
        ...accueilJeuneQueryModelResume
      } = accueilJeuneQueryModel
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/milo/accueil?maintenant=2023-03-03`)
        .set('authorization', `bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect({ ...accueilJeuneQueryModelResume })
    })

    it('renvoie une erreur quand le jeune est un jeune PE', async () => {
      getAccueilQueryHandler.execute
        .withArgs(
          { idJeune, maintenant, accessToken: token },
          unUtilisateurDecode()
        )
        .resolves(failure(new DroitsInsuffisants()))
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/milo/accueil?maintenant=2023-03-03`)
        .set('authorization', `bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN)
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/milo/accueil')
  })

  describe('GET /jeunes/milo/:idJeune/sessions', () => {
    const idJeune = '1'
    const token = 'token'

    it('renvoie la liste des sessions accessibles au jeune', async () => {
      getSessionsQueryHandler.execute
        .withArgs(
          {
            idJeune,
            accessToken: token,
            dateDebut: undefined,
            dateFin: undefined,
            filtrerEstInscrit: undefined
          },
          unUtilisateurDecode()
        )
        .resolves(success([uneSessionJeuneMiloQueryModel()]))

      await request(app.getHttpServer())
        .get(`/jeunes/milo/${idJeune}/sessions`)
        .set('authorization', `bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect([uneSessionJeuneMiloQueryModel()])
    })

    it('renvoie une erreur quand le jeune est un jeune PE', async () => {
      getSessionsQueryHandler.execute
        .withArgs(
          {
            idJeune,
            accessToken: token,
            dateDebut: undefined,
            dateFin: undefined,
            filtrerEstInscrit: undefined
          },
          unUtilisateurDecode()
        )
        .resolves(failure(new DroitsInsuffisants()))

      await request(app.getHttpServer())
        .get(`/jeunes/milo/${idJeune}/sessions`)
        .set('authorization', `bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN)
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      `/jeunes/milo/${idJeune}/sessions`
    )
  })

  describe('GET /jeunes/milo/:idJeune/sessions/:idSession', () => {
    const idJeune = '1'
    const idSession = 'A'
    const token = 'token'

    it('renvoie le détail de la session', async () => {
      getDetailSessionQueryHandler.execute
        .withArgs(
          { idSession, idJeune, accessToken: token },
          unUtilisateurDecode()
        )
        .resolves(success(unDetailSessionJeuneMiloQueryModel))

      await request(app.getHttpServer())
        .get(`/jeunes/milo/${idJeune}/sessions/${idSession}`)
        .set('authorization', `bearer ${token}`)
        .expect(HttpStatus.OK)
        .expect(unDetailSessionJeuneMiloQueryModel)
    })

    it('renvoie une erreur quand le jeune est un jeune PE', async () => {
      getDetailSessionQueryHandler.execute
        .withArgs(
          { idSession, idJeune, accessToken: token },
          unUtilisateurDecode()
        )
        .resolves(failure(new DroitsInsuffisants()))

      await request(app.getHttpServer())
        .get(`/jeunes/milo/${idJeune}/sessions/${idSession}`)
        .set('authorization', `bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN)
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      `/jeunes/milo/${idJeune}/sessions/${idSession}`
    )
  })

  describe('GET /jeunes/milo/:idJeune/mon-suivi', () => {
    it('renvoie les informations de suivi du jeune', async () => {
      // Given
      const dateDebutString = '2024-01-17T12:00:30+02:00'
      const dateFinString = '2024-02-17T12:00:30+02:00'
      const monSuiviQuery: GetMonSuiviMiloQuery = {
        idJeune: 'id-jeune',
        dateDebut: DateTime.fromISO(dateDebutString, {
          setZone: true
        }),
        dateFin: DateTime.fromISO(dateFinString, {
          setZone: true
        }),
        accessToken: 'token'
      }
      const monSuiviQueryModel: GetMonSuiviMiloQueryModel = {
        actions: [],
        rendezVous: [],
        sessionsMilo: []
      }
      monSuiviQueryHandler.execute
        .withArgs(monSuiviQuery, unUtilisateurDecode())
        .resolves(success(monSuiviQueryModel))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/milo/${monSuiviQuery.idJeune}/mon-suivi?dateDebut=2024-01-17T12%3A00%3A30%2B02%3A00&dateFin=2024-02-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', `bearer ${monSuiviQuery.accessToken}`)
        // Then
        .expect({
          actions: monSuiviQueryModel.actions,
          rendezVous: monSuiviQueryModel.rendezVous,
          sessionsMilo: monSuiviQueryModel.sessionsMilo
        })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/milo/1/mon-suivi?dateDebut=2024-01-17T12%3A00%3A30%2B02%3A00&dateFin=2024-02-17T12%3A00%3A30%2B02%3A00'
    )
  })
})
