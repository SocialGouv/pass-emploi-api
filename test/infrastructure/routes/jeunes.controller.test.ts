import { HttpStatus, INestApplication } from '@nestjs/common'
import { DateTime } from 'luxon'
import { ArchiverJeuneCommandHandler } from 'src/application/commands/archiver-jeune.command.handler'
import { DeleteJeuneInactifCommandHandler } from 'src/application/commands/delete-jeune-inactif.command.handler'
import { DeleteJeuneCommandHandler } from 'src/application/commands/delete-jeune.command.handler'
import { TransfererJeunesConseillerCommandHandler } from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from 'src/application/commands/update-jeune-configuration-application.command.handler'
import { UpdateJeunePreferencesCommandHandler } from 'src/application/commands/update-preferences-jeune.command.handler'
import { GetConseillersJeuneQueryHandler } from 'src/application/queries/get-conseillers-jeune.query.handler.db'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from 'src/application/queries/get-jeune-home-actions.query.handler.db'
import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.handler.db'
import { GetPreferencesJeuneQueryHandler } from 'src/application/queries/get-preferences-jeune.query.handler.db'
import { JeuneHomeAgendaQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { PreferencesJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { ResultatsRechercheMessageQueryModel } from 'src/application/queries/query-models/resultats-recherche-message-query.model'
import {
  RechercherMessageQuery,
  RechercherMessageQueryHandler
} from 'src/application/queries/rechercher-message.query.handler'
import {
  DomainError,
  DroitsInsuffisants,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { ArchiveJeune } from 'src/domain/archive-jeune'
import { Authentification } from 'src/domain/authentification'
import { JwtService } from 'src/infrastructure/auth/jwt.service'
import {
  TransfererConseillerPayload,
  UpdateConfigurationInput,
  UpdateJeunePreferencesPayload
} from 'src/infrastructure/routes/validation/jeunes.inputs'
import { RechercherMessagePayload } from 'src/infrastructure/routes/validation/messages.input'
import { DateService } from 'src/utils/date-service'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { uneActionQueryModel } from 'test/fixtures/query-models/action.query-model.fixtures'
import { StubbedClass, enleverLesUndefined, expect } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { GetComptageJeuneQueryHandler } from '../../../src/application/queries/get-comptage-jeune.query.handler.db'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'

describe('JeunesController', () => {
  let getDetailJeuneQueryHandler: StubbedClass<GetDetailJeuneQueryHandler>
  let getConseillersJeuneQueryHandler: StubbedClass<GetConseillersJeuneQueryHandler>
  let transfererJeunesConseillerCommandHandler: StubbedClass<TransfererJeunesConseillerCommandHandler>
  let deleteJeuneInactifCommandHandler: StubbedClass<DeleteJeuneInactifCommandHandler>
  let deleteJeuneCommandHandler: StubbedClass<DeleteJeuneCommandHandler>
  let getJeuneHomeSuiviQueryHandler: StubbedClass<GetJeuneHomeAgendaQueryHandler>
  let getJeuneHomeActionsQueryHandler: StubbedClass<GetJeuneHomeActionsQueryHandler>
  let updateJeuneConfigurationApplicationCommandHandler: StubbedClass<UpdateJeuneConfigurationApplicationCommandHandler>
  let archiverJeuneCommandHandler: StubbedClass<ArchiverJeuneCommandHandler>
  let updateJeunePreferencesCommandHandler: StubbedClass<UpdateJeunePreferencesCommandHandler>
  let getPreferencesJeuneQueryHandler: StubbedClass<GetPreferencesJeuneQueryHandler>
  let rechercherMessageQueryHandler: StubbedClass<RechercherMessageQueryHandler>
  let getComptageJeuneQueryHandler: StubbedClass<GetComptageJeuneQueryHandler>

  let jwtService: StubbedClass<JwtService>
  let dateService: StubbedClass<DateService>
  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    getDetailJeuneQueryHandler = app.get(GetDetailJeuneQueryHandler)
    getConseillersJeuneQueryHandler = app.get(GetConseillersJeuneQueryHandler)
    transfererJeunesConseillerCommandHandler = app.get(
      TransfererJeunesConseillerCommandHandler
    )
    deleteJeuneInactifCommandHandler = app.get(DeleteJeuneInactifCommandHandler)
    deleteJeuneCommandHandler = app.get(DeleteJeuneCommandHandler)
    getJeuneHomeSuiviQueryHandler = app.get(GetJeuneHomeAgendaQueryHandler)
    getJeuneHomeActionsQueryHandler = app.get(GetJeuneHomeActionsQueryHandler)
    updateJeuneConfigurationApplicationCommandHandler = app.get(
      UpdateJeuneConfigurationApplicationCommandHandler
    )
    archiverJeuneCommandHandler = app.get(ArchiverJeuneCommandHandler)
    updateJeunePreferencesCommandHandler = app.get(
      UpdateJeunePreferencesCommandHandler
    )
    getPreferencesJeuneQueryHandler = app.get(GetPreferencesJeuneQueryHandler)
    rechercherMessageQueryHandler = app.get(RechercherMessageQueryHandler)
    getComptageJeuneQueryHandler = app.get(GetComptageJeuneQueryHandler)

    jwtService = app.get(JwtService)
    dateService = app.get(DateService)
    dateService.now.returns(now)
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  describe('POST /jeunes/transferer', () => {
    const payload: TransfererConseillerPayload = {
      idConseillerSource: '1',
      idConseillerCible: '2',
      idsJeune: ['1']
    }
    it('transfere les jeunes de manière permanente', async () => {
      // Given
      transfererJeunesConseillerCommandHandler.execute.resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/transferer')
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.OK)

      expect(
        transfererJeunesConseillerCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseillerSource: '1',
          idConseillerCible: '2',
          idsJeunes: ['1'],
          estTemporaire: false,
          provenanceUtilisateur: Authentification.Type.CONSEILLER
        },
        unUtilisateurDecode()
      )
    })

    it('transfere les jeunes de manière temporaire', async () => {
      // Given
      transfererJeunesConseillerCommandHandler.execute.resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/transferer')
        .set('authorization', unHeaderAuthorization())
        .send({ ...payload, estTemporaire: true })
        .expect(HttpStatus.OK)

      expect(
        transfererJeunesConseillerCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseillerSource: '1',
          idConseillerCible: '2',
          idsJeunes: ['1'],
          estTemporaire: true,
          provenanceUtilisateur: Authentification.Type.CONSEILLER
        },
        unUtilisateurDecode()
      )
    })

    it("renvoie un code 403 si l'utilisateur n'est pas superviseur", async () => {
      // Given
      transfererJeunesConseillerCommandHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/transferer')
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
    })

    it("renvoie un code 400 si un jeune n'est pas lié au conseiller", async () => {
      // Given
      transfererJeunesConseillerCommandHandler.execute.resolves(
        failure(new MauvaiseCommandeError('jeunes invalides'))
      )

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/transferer')
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/transferer')
  })

  describe('GET /jeunes/:idJeune', () => {
    const idJeune = '1'
    it('renvoie le jeune quand il existe', async () => {
      // Given
      getDetailJeuneQueryHandler.execute.resolves(
        success(unDetailJeuneQueryModel())
      )

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)

      expect(getDetailJeuneQueryHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune
        },
        unUtilisateurDecode()
      )
    })
    it("renvoie une 404 quand le jeune n'existe pas", async () => {
      // Given
      getDetailJeuneQueryHandler.execute.resolves(
        failure(new NonTrouveError('Jeune', idJeune))
      )

      // When - Then
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.NOT_FOUND)

      expect(getDetailJeuneQueryHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune
        },
        unUtilisateurDecode()
      )
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1')
  })

  describe('GET /jeunes/:idJeune/conseillers', () => {
    const idJeune = '1'
    it("renvoie l'historique des conseillers quand il existe", async () => {
      // Given
      getConseillersJeuneQueryHandler.execute.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/conseillers`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect([])
      expect(
        getConseillersJeuneQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idJeune
        },
        unUtilisateurDecode()
      )
    })
    it("renvoit une 404 quand le jeune n'existe pas", async () => {
      // Given
      getConseillersJeuneQueryHandler.execute.resolves(
        failure(new NonTrouveError('Jeune', idJeune))
      )

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/conseillers`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
      expect(
        getConseillersJeuneQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idJeune
        },
        unUtilisateurDecode()
      )
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/conseillers')
  })

  describe('DELETE /jeunes/:idJeune', () => {
    it("supprime le jeune inactif quand t'es conseiller", async () => {
      //Given
      deleteJeuneInactifCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)

      expect(
        deleteJeuneInactifCommandHandler.execute
      ).to.have.be.calledWithExactly(
        {
          idConseiller: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
          idJeune: 'id-jeune'
        },
        unUtilisateurDecode()
      )
    })

    it("supprime le jeune quand t'es jeune", async () => {
      //Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      deleteJeuneCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)

      expect(deleteJeuneCommandHandler.execute).to.have.be.calledWith({
        idJeune: 'id-jeune'
      })
    })

    it("renvoie une 403 si l'utilisateur n'a pas les droits", async () => {
      //Given
      deleteJeuneInactifCommandHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.FORBIDDEN)
    })

    it("renvoie une 404 si une ressource n'existe pas", async () => {
      //Given
      deleteJeuneInactifCommandHandler.execute.resolves(
        failure(new NonTrouveError('Whenever', 'wherever'))
      )

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NOT_FOUND)
    })

    it("renvoie une 403 si le jeune n'est pas lié à l'utilisateur", async () => {
      //Given
      deleteJeuneInactifCommandHandler.execute.resolves(
        failure(new JeuneNonLieAuConseillerError('whenever', 'wherever'))
      )

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.FORBIDDEN)
    })

    it('renvoie une 403 si le jeune est actif', async () => {
      //Given
      deleteJeuneInactifCommandHandler.execute.resolves(
        failure(new JeunePasInactifError('whenever'))
      )

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.FORBIDDEN)
    })

    it("renvoie une erreur 500 s'il se passe qqch d'imprévu", async () => {
      //Given
      deleteJeuneInactifCommandHandler.execute.resolves(
        failure(
          new (class implements DomainError {
            readonly code = 'WHATEVER'
            readonly message = 'whatever'
          })()
        )
      )

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    ensureUserAuthenticationFailsIfInvalid('delete', '/jeunes/whatever')
  })

  describe('POST /jeunes/:idJeune/archiver', () => {
    it('archive le jeune', async () => {
      //Given
      archiverJeuneCommandHandler.execute
        .withArgs({
          idJeune: 'id-jeune',
          motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
          dateFinAccompagnement: DateTime.fromISO('2024-10-25T11:42:16.238Z', {
            setZone: true
          }),
          commentaire: undefined
        })
        .resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({
          motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
          dateFinAccompagnement: '2024-10-25T11:42:16.238Z'
        })
        //Then
        .expect(HttpStatus.NO_CONTENT)
    })

    it("renvoie une 403 si l'utilisateur n'a pas les droits", async () => {
      //Given
      archiverJeuneCommandHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({
          motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE
        })
        //Then
        .expect(HttpStatus.FORBIDDEN)
    })

    it('renvoie une 400 si motif non fourni', async () => {
      //Given
      archiverJeuneCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({})
        //Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('renvoie une 400 si motif Autre sans commentaire', async () => {
      //Given
      archiverJeuneCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({
          motif: ArchiveJeune.MotifSuppression.AUTRE
        })
        //Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('renvoie une 204 si motif Autre avec commentaire', async () => {
      //Given
      archiverJeuneCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({
          motif: ArchiveJeune.MotifSuppression.AUTRE,
          commentaire: 'test'
        })
        //Then
        .expect(HttpStatus.NO_CONTENT)
    })

    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/whatever/archiver')
  })

  describe('GET /jeunes/:idJeune/home/actions', () => {
    const idJeune = '1'
    it('retourne la home action du jeune', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getJeuneHomeActionsQueryHandler.execute
        .withArgs(
          {
            idJeune
          },
          unUtilisateurDecode()
        )
        .resolves({
          actions: []
        })

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/home/actions`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect({ actions: [] })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/home/actions')
  })

  describe('GET /jeunes/:idJeune/home/agenda', () => {
    const idJeune = '1'
    const maintenant = '2022-08-17T12:00:30+02:00'
    const queryModel: JeuneHomeAgendaQueryModel = {
      actions: [
        enleverLesUndefined(uneActionQueryModel()),
        enleverLesUndefined(uneActionQueryModel())
      ],
      rendezVous: [],
      sessionsMilo: [],
      metadata: {
        actionsEnRetard: 2,
        dateDeFin: new Date(maintenant),
        dateDeDebut: new Date(maintenant)
      }
    }
    it('retourne la home agenda du jeune quand tout se passe bien', async () => {
      // Given
      const token = 'token'
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getJeuneHomeSuiviQueryHandler.execute
        .withArgs(
          { idJeune, maintenant, accessToken: token },
          unUtilisateurDecode()
        )
        .resolves(success(queryModel))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/home/agenda?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', `bearer ${token}`)
        // Then
        .expect({
          actions: queryModel.actions,
          rendezVous: queryModel.rendezVous,
          sessionsMilo: queryModel.sessionsMilo,
          metadata: {
            actionsEnRetard: 2,
            dateDeFin: '2022-08-17T10:00:30.000Z',
            dateDeDebut: '2022-08-17T10:00:30.000Z'
          }
        })
    })
    it("rejette quand la date n'est pas au bon format", async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/home/agenda?maintenant=30122022`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('rejette quand la query est en erreur', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getJeuneHomeSuiviQueryHandler.execute.resolves(
        failure(new NonTrouveError(''))
      )

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/home/agenda?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/home/agenda?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00'
    )
  })
  describe('GET /jeunes/:idJeune/comptage', () => {
    it('retourne le comptage quand tout se passe bien', async () => {
      // Given
      const idJeune = '1'
      const result = {
        nbHeuresDeclarees: 0,
        nbHeuresValidees: 0,
        dateDerniereMiseAJour: uneDatetime().toISO()
      }
      getComptageJeuneQueryHandler.execute.resolves(success(result))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/comptage?dateDebut=2020-10-10&dateFin=2020-10-17`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(result)

      expect(
        getComptageJeuneQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idJeune,
          accessToken: 'coucou',
          dateDebut: DateTime.fromISO('2020-10-10', {
            setZone: true
          }).startOf('day'),
          dateFin: DateTime.fromISO('2020-10-17', {
            setZone: true
          }).endOf('day')
        },
        unUtilisateurDecode()
      )
    })
    it('retourne 400', async () => {
      // Given
      const idJeune = '1'
      const result = {
        nbHeuresDeclarees: 0,
        nbHeuresValidees: 0,
        dateDerniereMiseAJour: uneDatetime().toISO()
      }
      getComptageJeuneQueryHandler.execute.resolves(success(result))

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/comptage?dateDebut=2020-10-10`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/comptage?dateDebut=2020-10-10&dateFin=2020-10-17'
    )
  })

  describe('PUT /jeunes/:idJeune/configuration-application', () => {
    const idJeune = '1'
    const payload: UpdateConfigurationInput = {
      registration_token: 'token',
      fuseauHoraire: 'Europe/Paris'
    }

    describe("quand c'est en succès", () => {
      it("met à jour le token, la version de l'app, l'installation id et l'instance id", async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateJeuneConfigurationApplicationCommandHandler.execute
          .withArgs(
            {
              idJeune,
              pushNotificationToken: payload.registration_token,
              appVersion: 'coucou',
              installationId: 'xxx-xx-xxx',
              instanceId: 'yyy-yy-yyy',
              fuseauHoraire: 'Europe/Paris'
            },
            unUtilisateurDecode()
          )
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/configuration-application`)
          .set('authorization', unHeaderAuthorization())
          .set('x-appversion', 'coucou')
          .set('x-installationid', 'xxx-xx-xxx')
          .set('x-instanceid', 'yyy-yy-yyy')
          .send(payload)
          // Then
          .expect(HttpStatus.OK)
      })
      it("met à jour le token sans version de l'app", async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateJeuneConfigurationApplicationCommandHandler.execute
          .withArgs(
            {
              idJeune,
              pushNotificationToken: payload.registration_token,
              appVersion: undefined,
              installationId: undefined,
              instanceId: undefined,
              fuseauHoraire: 'Europe/Paris'
            },
            unUtilisateurDecode()
          )
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/configuration-application`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.OK)
      })
    })

    describe('quand le payload est invalide', () => {
      it('renvoie une 400', async () => {
        // Given
        const payload: UpdateConfigurationInput = {
          registration_token: 'token',
          fuseauHoraire: 'Foo/Bar'
        }
        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/configuration-application`)
          .set('authorization', unHeaderAuthorization())
          .set('x-appversion', 'coucou')
          .set('x-installationid', 'xxx-xx-xxx')
          .set('x-instanceid', 'yyy-yy-yyy')
          .send(payload)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'put',
      '/jeunes/1/configuration-application'
    )
  })

  describe('PUT /jeunes/:idJeune/preferences', () => {
    const idJeune = '1'
    const payload: UpdateJeunePreferencesPayload = {
      partageFavoris: false,
      alertesOffres: false,
      messages: false,
      creationActionConseiller: false,
      rendezVousSessions: false
    }

    describe("quand c'est en succès", () => {
      it('met à jour les préférences', async () => {
        // Given
        updateJeunePreferencesCommandHandler.execute.resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/preferences`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.OK)

        expect(
          updateJeunePreferencesCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            partageFavoris: false,
            alertesOffres: false,
            messages: false,
            creationActionConseiller: false,
            rendezVousSessions: false,
            rappelActions: undefined
          },
          unUtilisateurDecode()
        )
      })
    })

    ensureUserAuthenticationFailsIfInvalid('put', '/jeunes/1/preferences')
  })

  describe('GET /jeunes/:idJeune/preferences', () => {
    const idJeune = '1'

    describe("quand c'est en succès", () => {
      it('renvoie les préférences', async () => {
        // Given
        const queryModel: PreferencesJeuneQueryModel = {
          partageFavoris: true,
          alertesOffres: true,
          messages: true,
          creationActionConseiller: true,
          rendezVousSessions: true,
          rappelActions: true
        }
        getPreferencesJeuneQueryHandler.execute
          .withArgs(
            {
              idJeune
            },
            unUtilisateurDecode()
          )
          .resolves(success(queryModel))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/preferences`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)
          .expect(queryModel)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/preferences')
  })

  describe('GET /jeunes/:idJeune/messages', () => {
    const idJeune = '1'
    const query: RechercherMessageQuery = {
      recherche: 'rendez-vous',
      idBeneficiaire: idJeune
    }

    const payload: RechercherMessagePayload = {
      recherche: 'rendez-vous'
    }

    it('recherche une string dans une conversation', async () => {
      // Given
      const queryModel: ResultatsRechercheMessageQueryModel = {
        resultats: [
          {
            id: 'id-message',
            idConversation: 'id-conversation',
            message: {
              message: 'Nous avions rendez-vous à 16h',
              id: 'id-message',
              idConseiller: 'id-conseiller'
            },
            matches: [
              {
                match: [12, 22]
              }
            ]
          }
        ]
      }

      rechercherMessageQueryHandler.execute
        .withArgs(query)
        .resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/messages`)
        .query(payload)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(queryModel)

      expect(
        rechercherMessageQueryHandler.execute
      ).to.have.been.calledWithExactly(query, unUtilisateurDecode())

      rechercherMessageQueryHandler.execute.withArgs(query).resolves()
    })
  })
})
