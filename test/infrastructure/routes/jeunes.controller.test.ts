import { HttpStatus, INestApplication } from '@nestjs/common'
import { DateTime } from 'luxon'
import { CreateActionCommandHandler } from 'src/application/commands/action/create-action.command.handler'
import { ArchiverJeuneCommandHandler } from 'src/application/commands/archiver-jeune.command.handler'
import { DeleteJeuneInactifCommandHandler } from 'src/application/commands/delete-jeune-inactif.command.handler'
import { DeleteJeuneCommandHandler } from 'src/application/commands/delete-jeune.command.handler'
import { CreateDemarcheCommandHandler } from 'src/application/commands/pole-emploi/create-demarche.command.handler'
import { UpdateStatutDemarcheCommandHandler } from 'src/application/commands/pole-emploi/update-demarche.command.handler'
import { TransfererJeunesConseillerCommandHandler } from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from 'src/application/commands/update-jeune-configuration-application.command.handler'
import { UpdateJeunePreferencesCommandHandler } from 'src/application/commands/update-preferences-jeune.command.handler'
import { GetConseillersJeuneQueryHandler } from 'src/application/queries/get-conseillers-jeune.query.handler.db'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from 'src/application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.handler.db'
import { GetJeuneHomeDemarchesQueryHandler } from 'src/application/queries/get-jeune-home-demarches.query.handler'
import { GetPreferencesJeuneQueryHandler } from 'src/application/queries/get-preferences-jeune.handler.db'
import { GetSuiviSemainePoleEmploiQueryHandler } from 'src/application/queries/get-suivi-semaine-pole-emploi.query.handler'
import {
  JeuneHomeAgendaQueryModel,
  SuiviSemainePoleEmploiQueryModel
} from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { JeuneHomeDemarcheQueryModel } from 'src/application/queries/query-models/home-jeune.query-model'
import { PreferencesJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { RendezVousJeuneQueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import { GetAnimationsCollectivesJeuneQueryHandler } from 'src/application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { GetUnRendezVousJeuneQueryHandler } from 'src/application/queries/rendez-vous/get-un-rendez-vous-jeune.query.handler.db'
import {
  DomainError,
  DroitsInsuffisants,
  ErreurHttp,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Cached } from 'src/building-blocks/types/query'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { ArchiveJeune } from 'src/domain/archive-jeune'
import { Authentification } from 'src/domain/authentification'
import { Demarche } from 'src/domain/demarche'
import { RendezVous } from 'src/domain/rendez-vous/rendez-vous'
import { JwtService } from 'src/infrastructure/auth/jwt.service'
import { CreateActionParLeJeunePayload } from 'src/infrastructure/routes/validation/actions.inputs'
import {
  CreateDemarchePayload,
  UpdateStatutDemarchePayload
} from 'src/infrastructure/routes/validation/demarches.inputs'
import {
  TransfererConseillerPayload,
  UpdateConfigurationInput,
  UpdateJeunePreferencesPayload
} from 'src/infrastructure/routes/validation/jeunes.inputs'
import { DateService } from 'src/utils/date-service'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { uneDatetime, uneDatetimeAvecOffset } from 'test/fixtures/date.fixture'
import { uneDemarche } from 'test/fixtures/demarche.fixture'
import { uneActionQueryModelSansJeune } from 'test/fixtures/query-models/action.query-model.fixtures'
import { uneDemarcheQueryModel } from 'test/fixtures/query-models/demarche.query-model.fixtures'
import { unRendezVousJeuneDetailQueryModel } from 'test/fixtures/query-models/rendez-vous.query-model.fixtures'
import { enleverLesUndefined, expect, StubbedClass } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { Qualification } from 'src/domain/action/qualification'
import Code = Qualification.Code

describe('JeunesController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let getDetailJeuneQueryHandler: StubbedClass<GetDetailJeuneQueryHandler>
  let getConseillersJeuneQueryHandler: StubbedClass<GetConseillersJeuneQueryHandler>
  let transfererJeunesConseillerCommandHandler: StubbedClass<TransfererJeunesConseillerCommandHandler>
  let deleteJeuneInactifCommandHandler: StubbedClass<DeleteJeuneInactifCommandHandler>
  let deleteJeuneCommandHandler: StubbedClass<DeleteJeuneCommandHandler>
  let getRendezVousJeuneQueryHandler: StubbedClass<GetRendezVousJeuneQueryHandler>
  let getRendezVousJeunePoleEmploiQueryHandler: StubbedClass<GetRendezVousJeunePoleEmploiQueryHandler>
  let getJeuneHomeDemarchesQueryHandler: StubbedClass<GetJeuneHomeDemarchesQueryHandler>
  let getJeuneHomeSuiviQueryHandler: StubbedClass<GetJeuneHomeAgendaQueryHandler>
  let getJeuneHomeAgendaPoleEmploiQueryHandler: StubbedClass<GetSuiviSemainePoleEmploiQueryHandler>
  let getJeuneHomeActionsQueryHandler: StubbedClass<GetJeuneHomeActionsQueryHandler>
  let updateStatutDemarcheCommandHandler: StubbedClass<UpdateStatutDemarcheCommandHandler>
  let createDemarcheCommandHandler: StubbedClass<CreateDemarcheCommandHandler>
  let updateJeuneConfigurationApplicationCommandHandler: StubbedClass<UpdateJeuneConfigurationApplicationCommandHandler>
  let archiverJeuneCommandHandler: StubbedClass<ArchiverJeuneCommandHandler>
  let updateJeunePreferencesCommandHandler: StubbedClass<UpdateJeunePreferencesCommandHandler>
  let getPreferencesJeuneQueryHandler: StubbedClass<GetPreferencesJeuneQueryHandler>
  let getAnimationsCollectivesJeuneQueryHandler: StubbedClass<GetAnimationsCollectivesJeuneQueryHandler>
  let getUnRendezVousJeuneQueryHandler: StubbedClass<GetUnRendezVousJeuneQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let dateService: StubbedClass<DateService>
  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    createActionCommandHandler = app.get(CreateActionCommandHandler)
    getDetailJeuneQueryHandler = app.get(GetDetailJeuneQueryHandler)
    getConseillersJeuneQueryHandler = app.get(GetConseillersJeuneQueryHandler)
    transfererJeunesConseillerCommandHandler = app.get(
      TransfererJeunesConseillerCommandHandler
    )
    deleteJeuneInactifCommandHandler = app.get(DeleteJeuneInactifCommandHandler)
    deleteJeuneCommandHandler = app.get(DeleteJeuneCommandHandler)
    getRendezVousJeuneQueryHandler = app.get(GetRendezVousJeuneQueryHandler)
    getRendezVousJeunePoleEmploiQueryHandler = app.get(
      GetRendezVousJeunePoleEmploiQueryHandler
    )
    getJeuneHomeDemarchesQueryHandler = app.get(
      GetJeuneHomeDemarchesQueryHandler
    )
    getJeuneHomeSuiviQueryHandler = app.get(GetJeuneHomeAgendaQueryHandler)
    getJeuneHomeAgendaPoleEmploiQueryHandler = app.get(
      GetSuiviSemainePoleEmploiQueryHandler
    )
    getJeuneHomeActionsQueryHandler = app.get(GetJeuneHomeActionsQueryHandler)
    updateStatutDemarcheCommandHandler = app.get(
      UpdateStatutDemarcheCommandHandler
    )
    createDemarcheCommandHandler = app.get(CreateDemarcheCommandHandler)
    updateJeuneConfigurationApplicationCommandHandler = app.get(
      UpdateJeuneConfigurationApplicationCommandHandler
    )
    archiverJeuneCommandHandler = app.get(ArchiverJeuneCommandHandler)
    updateJeunePreferencesCommandHandler = app.get(
      UpdateJeunePreferencesCommandHandler
    )
    getPreferencesJeuneQueryHandler = app.get(GetPreferencesJeuneQueryHandler)
    getAnimationsCollectivesJeuneQueryHandler = app.get(
      GetAnimationsCollectivesJeuneQueryHandler
    )
    getUnRendezVousJeuneQueryHandler = app.get(GetUnRendezVousJeuneQueryHandler)

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

  describe('POST /jeunes/:idJeune/action', () => {
    const nowJsPlus3Mois = now.plus({ months: 3 })

    const actionPayload: CreateActionParLeJeunePayload = {
      content: "Ceci est un contenu d'action",
      comment: 'Ceci est un commentaire',
      status: Action.Statut.EN_COURS,
      codeQualification: Code.CITOYENNETE
    }
    it("renvoie l'id de l'action créée avec echeance par defaut", async () => {
      // Given
      const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayload)

        // Then
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: 'ABCDE',
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: Action.Statut.EN_COURS,
          commentaire: 'Ceci est un commentaire',
          dateEcheance: nowJsPlus3Mois,
          rappel: false,
          codeQualification: Code.CITOYENNETE
        },
        unUtilisateurDecode()
      )
    })
    it("renvoie l'id de l'action créée avec echeance par defaut sans statut", async () => {
      // Given
      const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send({
          content: "Ceci est un contenu d'action",
          comment: 'Ceci est un commentaire',
          codeQualification: Code.CITOYENNETE
        })

        // Then
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: 'ABCDE',
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: undefined,
          commentaire: 'Ceci est un commentaire',
          dateEcheance: nowJsPlus3Mois,
          rappel: false,
          codeQualification: Code.CITOYENNETE
        },
        unUtilisateurDecode()
      )
    })
    it("renvoie l'id de l'action créée avec echeance par defaut et statut done", async () => {
      // Given
      const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send({
          content: "Ceci est un contenu d'action",
          comment: 'Ceci est un commentaire',
          status: Action.Statut.TERMINEE,
          codeQualification: Code.CITOYENNETE
        })

        // Then
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: 'ABCDE',
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: Action.Statut.TERMINEE,
          commentaire: 'Ceci est un commentaire',
          dateEcheance: now,
          rappel: false,
          codeQualification: Code.CITOYENNETE
        },
        unUtilisateurDecode()
      )
    })
    it("renvoie l'id de l'action créée avec echeance et rappel", async () => {
      // Given
      const payloadAvecEcheance: CreateActionParLeJeunePayload = {
        ...actionPayload,
        dateEcheance: uneDatetimeAvecOffset().toISO(),
        rappel: false
      }
      const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(payloadAvecEcheance)

        // Then
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: 'ABCDE',
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: Action.Statut.EN_COURS,
          commentaire: 'Ceci est un commentaire',
          dateEcheance: uneDatetimeAvecOffset(),
          rappel: false,
          codeQualification: Code.CITOYENNETE
        },
        unUtilisateurDecode()
      )
    })

    it("renvoie une 404 (Not Found) quand le jeune n'existe pas", async () => {
      const echec = failure(new NonTrouveError('Jeune', 'ABCDE'))
      createActionCommandHandler.execute.resolves(echec)

      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayload)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('renvoie une 400 (Bad Request) quand le statut est incorrect', async () => {
      const echec = failure(new Action.StatutInvalide('whatever_status'))
      createActionCommandHandler.execute.resolves(echec)

      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayload)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request'
        })
    })

    it('renvoie une 400 (Bad Request) quand le statut est égal à "annulée"', async () => {
      const actionPayloadWithCanceledStatus: CreateActionParLeJeunePayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire',
        status: Action.Statut.ANNULEE
      }

      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayloadWithCanceledStatus)
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/action')
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
          commentaire: undefined
        })
        .resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({
          motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE
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

  describe('GET /jeunes/:idJeune/rendez-vous', () => {
    const idJeune = '1'
    describe("quand c'est un jeune pole-emploi", () => {
      it('renvoie une 404 quand le jeune n"existe pas', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', '1'))
        )
        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
      it('retourne les rdv', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
          success({ queryModel: [] })
        )

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect([])
      })
      it('renvoie une 500 quand la query est cachée', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
        const data: Cached<RendezVousJeuneQueryModel[]> = {
          queryModel: [],
          dateDuCache: uneDatetime()
        }
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(success(data))
        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      })
    })

    describe("quand ce n'est pas un jeune pole-emploi", () => {
      const idJeune = '1'
      const rendezVousJeuneQueryModel: RendezVousJeuneQueryModel[] = []

      it('renvoit une 404 quand le jeune n"existe pas', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', '1'))
        )
        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
      it("retourne tous les rendez-vous si aucune période n'est renseignée", async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          success(rendezVousJeuneQueryModel)
        )
        // When - Then
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
        expect(
          getRendezVousJeuneQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            periode: undefined
          },
          unUtilisateurDecode()
        )
      })
      it('retourne les rendez-vous futurs si periode FUTURS est renseignée', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          success(rendezVousJeuneQueryModel)
        )
        // When - Then
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous?periode=FUTURS`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
        expect(
          getRendezVousJeuneQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            periode: RendezVous.Periode.FUTURS
          },
          unUtilisateurDecode()
        )
      })
      it('retourne les rendez-vous passés si periode PASSES est renseignée', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          success(rendezVousJeuneQueryModel)
        )
        // When - Then
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous?periode=PASSES`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
        expect(
          getRendezVousJeuneQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            periode: RendezVous.Periode.PASSES
          },
          unUtilisateurDecode()
        )
      })
      it('retourne une 400 quand periode est mal formatée', async () => {
        // When - Then
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous?periode=XX`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/rendezvous')
  })

  describe('GET /jeunes/:idJeune/rendez-vous/:idRendezVous', () => {
    const idJeune = '1'
    const idRendezVous = 'bcd60403-5f10-4a16-a660-2099d79ebd66'
    const queryModel = unRendezVousJeuneDetailQueryModel()

    it('renvoit une 404 quand le rendez vous n"existe pas', async () => {
      // Given
      getUnRendezVousJeuneQueryHandler.execute.resolves(
        failure(new NonTrouveError('RendezVous', idRendezVous))
      )
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous/${idRendezVous}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('retourne le rendez vous', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getUnRendezVousJeuneQueryHandler.execute
        .withArgs({ idJeune, idRendezVous }, unUtilisateurDecode())
        .resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous/${idRendezVous}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(queryModel))
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/rendezvous/2')
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
        enleverLesUndefined(uneActionQueryModelSansJeune()),
        enleverLesUndefined(uneActionQueryModelSansJeune())
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

  describe('GET /jeunes/:idJeune/home/agenda/pole-emploi', () => {
    const idJeune = '1'
    const maintenant = '2022-08-17T12:00:30+02:00'
    const queryModel: SuiviSemainePoleEmploiQueryModel = {
      demarches: [
        enleverLesUndefined(uneDemarcheQueryModel()),
        enleverLesUndefined(uneDemarcheQueryModel())
      ],
      rendezVous: [],
      metadata: {
        demarchesEnRetard: 2,
        dateDeFin: new Date(maintenant),
        dateDeDebut: new Date(maintenant)
      }
    }
    it('retourne la home agenda du jeune quand tout se passe bien', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getJeuneHomeAgendaPoleEmploiQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant: DateTime.fromISO(maintenant, { setZone: true }),
            accessToken: 'coucou'
          },
          unUtilisateurDecode()
        )
        .resolves(success({ queryModel }))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect({
          demarches: queryModel.demarches,
          rendezVous: queryModel.rendezVous,
          metadata: {
            demarchesEnRetard: 2,
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
        .get(`/jeunes/${idJeune}/home/agenda/pole-emploi?maintenant=30122022`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('rejette quand la query est en erreur', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getJeuneHomeAgendaPoleEmploiQueryHandler.execute.resolves(
        failure(new NonTrouveError(''))
      )

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })

    it('rejette quand la query est cachée', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      const data: Cached<SuiviSemainePoleEmploiQueryModel> = {
        queryModel: queryModel,
        dateDuCache: uneDatetime()
      }
      getJeuneHomeAgendaPoleEmploiQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant: DateTime.fromISO(maintenant, { setZone: true }),
            accessToken: 'coucou'
          },
          unUtilisateurDecode()
        )
        .resolves(success(data))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00'
    )
  })

  describe('GET /jeunes/:idJeune/home/demarches', () => {
    const idJeune = '1'
    describe("quand c'est en succès", () => {
      it('retourne la home demarches du jeune', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        getJeuneHomeDemarchesQueryHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(
            success({
              queryModel: {
                actions: []
              }
            })
          )

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/home/demarches`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect({ actions: [] })
      })
    })
    describe("quand c'est en échec", () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        getJeuneHomeDemarchesQueryHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(failure(new ErreurHttp("C'est cassé", 400)))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/home/demarches`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
    describe('quand la query est cachée', () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        const data: Cached<JeuneHomeDemarcheQueryModel> = {
          queryModel: {
            actions: []
          },
          dateDuCache: uneDatetime()
        }
        getJeuneHomeDemarchesQueryHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(success(data))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/home/demarches`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/home/demarches')
  })

  describe('PUT /jeunes/:idJeune/demarches/:idDemarche/statut', () => {
    const idJeune = '1'
    const idDemarche = 'demarche'
    const payload: UpdateStatutDemarchePayload = {
      statut: Demarche.Statut.REALISEE,
      dateFin: uneDatetimeAvecOffset().toISO()
    }
    const demarche = uneDemarche()
    describe("quand c'est en succès", () => {
      it('met à jour le statut et retourne la demarche', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateStatutDemarcheCommandHandler.execute
          .withArgs(
            {
              statut: payload.statut,
              dateFin: uneDatetimeAvecOffset(),
              dateDebut: undefined,
              idJeune,
              idDemarche,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(success(demarche))

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/demarches/${idDemarche}/statut`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.OK)
      })
    })
    describe("quand c'est en échec", () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateStatutDemarcheCommandHandler.execute.resolves(
          failure(new ErreurHttp("C'est cassé", 400))
        )

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/demarches/${idDemarche}/statut`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'put',
      '/jeunes/1/demarches/123/statut'
    )
  })

  describe('POST /jeunes/:idJeune/demarches', () => {
    const idJeune = '1'
    const payload: CreateDemarchePayload = {
      description: 'string',
      dateFin: uneDatetimeAvecOffset().toISO()
    }
    const demarche = uneDemarche()
    describe("quand c'est en succès", () => {
      it('crée et retourne la demarche', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        createDemarcheCommandHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou',
              description: payload.description,
              dateFin: uneDatetimeAvecOffset()
            },
            unUtilisateurDecode()
          )
          .resolves(success(demarche))

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/${idJeune}/demarches`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.CREATED)
      })
    })
    describe("quand c'est en échec", () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        createDemarcheCommandHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou',
              description: payload.description,
              dateFin: uneDatetimeAvecOffset()
            },
            unUtilisateurDecode()
          )
          .resolves(failure(new ErreurHttp("C'est cassé", 400)))

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/${idJeune}/demarches`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie une erreur 400 quand la description ne respecte pas la longeur autorisée', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/${idJeune}/demarches`)
          .set('authorization', unHeaderAuthorization())
          .send({ ...payload, description: 'a' })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/1/demarches')
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
      partageFavoris: false
    }

    describe("quand c'est en succès", () => {
      it('met à jour les préférences', async () => {
        // Given
        updateJeunePreferencesCommandHandler.execute
          .withArgs(
            {
              idJeune,
              partageFavoris: false
            },
            unUtilisateurDecode()
          )
          .resolves(emptySuccess())

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
            partageFavoris: false
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
          partageFavoris: true
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

  describe('GET /jeunes/:idJeune/animations-collectives', () => {
    const idJeune = '1'
    it('retourne la home agenda du jeune quand tout se passe bien', async () => {
      // Given
      getAnimationsCollectivesJeuneQueryHandler.execute.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/animations-collectives?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect([])
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/animations-collectives?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00'
    )
  })
})
