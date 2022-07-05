import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { ArchiverJeuneCommandHandler } from 'src/application/commands/archiver-jeune.command.handler'
import { CreateDemarcheCommandHandler } from 'src/application/commands/create-demarche.command.handler'
import { DeleteJeuneCommandHandler } from 'src/application/commands/delete-jeune.command.handler'
import { TransfererJeunesConseillerCommandHandler } from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateStatutDemarcheCommandHandler } from 'src/application/commands/update-demarche.command.handler'
import { UpdateNotificationTokenCommandHandler } from 'src/application/commands/update-notification-token.command.handler'
import { ArchiveJeune } from 'src/domain/archive-jeune'
import { Core } from 'src/domain/core'
import { Demarche } from 'src/domain/demarche'
import { RendezVous } from 'src/domain/rendez-vous'
import {
  CreateDemarchePayload,
  UpdateStatutDemarchePayload
} from 'src/infrastructure/routes/validation/demarches.inputs'
import {
  PutNotificationTokenInput,
  TransfererConseillerPayload
} from 'src/infrastructure/routes/validation/jeunes.inputs'
import * as request from 'supertest'
import { uneDate } from 'test/fixtures/date.fixture'
import { uneDemarche } from 'test/fixtures/demarche.fixture'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import { DeleteJeuneInactifCommandHandler } from '../../../src/application/commands/delete-jeune-inactif.command.handler'
import {
  ActionsByJeuneOutput,
  GetActionsByJeuneQueryHandler
} from '../../../src/application/queries/get-actions-by-jeune.query.handler.db'
import { GetActionsJeunePoleEmploiQueryHandler } from '../../../src/application/queries/get-actions-jeune-pole-emploi.query.handler'
import { GetConseillersJeuneQueryHandler } from '../../../src/application/queries/get-conseillers-jeune.query.handler.db'
import { GetDetailJeuneQueryHandler } from '../../../src/application/queries/get-detail-jeune.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from '../../../src/application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../src/application/queries/get-jeune-home-demarches.query.handler'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../../src/application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from '../../../src/application/queries/get-rendez-vous-jeune.query.handler.db'
import { DetailJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-model'
import { RendezVousJeuneQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import {
  DomainError,
  DroitsInsuffisants,
  ErreurHttp,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import { CreateActionAvecStatutPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import StatutInvalide = Action.StatutInvalide

describe('JeunesController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let getDetailJeuneQueryHandler: StubbedClass<GetDetailJeuneQueryHandler>
  let getConseillersJeuneQueryHandler: StubbedClass<GetConseillersJeuneQueryHandler>
  let transfererJeunesConseillerCommandHandler: StubbedClass<TransfererJeunesConseillerCommandHandler>
  let deleteJeuneInactifCommandHandler: StubbedClass<DeleteJeuneInactifCommandHandler>
  let deleteJeuneCommandHandler: StubbedClass<DeleteJeuneCommandHandler>
  let getRendezVousJeuneQueryHandler: StubbedClass<GetRendezVousJeuneQueryHandler>
  let getRendezVousJeunePoleEmploiQueryHandler: StubbedClass<GetRendezVousJeunePoleEmploiQueryHandler>
  let getActionsPoleEmploiQueryHandler: StubbedClass<GetActionsJeunePoleEmploiQueryHandler>
  let getJeuneHomeDemarchesQueryHandler: StubbedClass<GetJeuneHomeDemarchesQueryHandler>
  let getJeuneHomeActionsQueryHandler: StubbedClass<GetJeuneHomeActionsQueryHandler>
  let updateStatutDemarcheCommandHandler: StubbedClass<UpdateStatutDemarcheCommandHandler>
  let createDemarcheCommandHandler: StubbedClass<CreateDemarcheCommandHandler>
  let getActionsByJeuneQueryHandler: StubbedClass<GetActionsByJeuneQueryHandler>
  let updateNotificationTokenCommandHandler: StubbedClass<UpdateNotificationTokenCommandHandler>
  let archiverJeuneCommandHandler: StubbedClass<ArchiverJeuneCommandHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    getDetailJeuneQueryHandler = stubClass(GetDetailJeuneQueryHandler)
    transfererJeunesConseillerCommandHandler = stubClass(
      TransfererJeunesConseillerCommandHandler
    )
    deleteJeuneInactifCommandHandler = stubClass(
      DeleteJeuneInactifCommandHandler
    )
    deleteJeuneCommandHandler = stubClass(DeleteJeuneCommandHandler)
    getConseillersJeuneQueryHandler = stubClass(GetConseillersJeuneQueryHandler)
    getRendezVousJeunePoleEmploiQueryHandler = stubClass(
      GetRendezVousJeunePoleEmploiQueryHandler
    )
    getRendezVousJeuneQueryHandler = stubClass(GetRendezVousJeuneQueryHandler)
    getActionsPoleEmploiQueryHandler = stubClass(
      GetActionsJeunePoleEmploiQueryHandler
    )
    jwtService = stubClass(JwtService)
    getRendezVousJeuneQueryHandler = stubClass(GetRendezVousJeuneQueryHandler)
    getJeuneHomeActionsQueryHandler = stubClass(GetJeuneHomeActionsQueryHandler)
    getJeuneHomeDemarchesQueryHandler = stubClass(
      GetJeuneHomeDemarchesQueryHandler
    )
    updateStatutDemarcheCommandHandler = stubClass(
      UpdateStatutDemarcheCommandHandler
    )
    createDemarcheCommandHandler = stubClass(CreateDemarcheCommandHandler)
    getActionsByJeuneQueryHandler = stubClass(GetActionsByJeuneQueryHandler)
    updateNotificationTokenCommandHandler = stubClass(
      UpdateNotificationTokenCommandHandler
    )
    archiverJeuneCommandHandler = stubClass(ArchiverJeuneCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(GetDetailJeuneQueryHandler)
      .useValue(getDetailJeuneQueryHandler)
      .overrideProvider(GetRendezVousJeuneQueryHandler)
      .useValue(getRendezVousJeuneQueryHandler)
      .overrideProvider(TransfererJeunesConseillerCommandHandler)
      .useValue(transfererJeunesConseillerCommandHandler)
      .overrideProvider(DeleteJeuneInactifCommandHandler)
      .useValue(deleteJeuneInactifCommandHandler)
      .overrideProvider(DeleteJeuneCommandHandler)
      .useValue(deleteJeuneCommandHandler)
      .overrideProvider(GetConseillersJeuneQueryHandler)
      .useValue(getConseillersJeuneQueryHandler)
      .overrideProvider(GetRendezVousJeuneQueryHandler)
      .useValue(getRendezVousJeuneQueryHandler)
      .overrideProvider(GetRendezVousJeunePoleEmploiQueryHandler)
      .useValue(getRendezVousJeunePoleEmploiQueryHandler)
      .overrideProvider(GetActionsJeunePoleEmploiQueryHandler)
      .useValue(getActionsPoleEmploiQueryHandler)
      .overrideProvider(GetJeuneHomeActionsQueryHandler)
      .useValue(getJeuneHomeActionsQueryHandler)
      .overrideProvider(GetJeuneHomeDemarchesQueryHandler)
      .useValue(getJeuneHomeDemarchesQueryHandler)
      .overrideProvider(UpdateStatutDemarcheCommandHandler)
      .useValue(updateStatutDemarcheCommandHandler)
      .overrideProvider(CreateDemarcheCommandHandler)
      .useValue(createDemarcheCommandHandler)
      .overrideProvider(GetActionsByJeuneQueryHandler)
      .useValue(getActionsByJeuneQueryHandler)
      .overrideProvider(UpdateNotificationTokenCommandHandler)
      .useValue(updateNotificationTokenCommandHandler)
      .overrideProvider(ArchiverJeuneCommandHandler)
      .useValue(archiverJeuneCommandHandler)
      .overrideProvider(JwtService)
      .useValue(jwtService)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  after(async () => {
    await app.close()
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
          structure: Core.Structure.MILO
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
          structure: Core.Structure.MILO
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
    const actionPayload: CreateActionAvecStatutPayload = {
      content: "Ceci est un contenu d'action",
      comment: 'Ceci est un commentaire',
      status: Action.Statut.EN_COURS
    }
    it("renvoie l'id de l'action créée", async () => {
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
          commentaire: 'Ceci est un commentaire'
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
      const echec = failure(new StatutInvalide('whatever_status'))
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
      const actionPayloadWithCanceledStatus: CreateActionAvecStatutPayload = {
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
    it('renvoit le jeune quand il existe', async () => {
      // Given
      const detailJeuneQueryModel: DetailJeuneQueryModel =
        unDetailJeuneQueryModel()
      getDetailJeuneQueryHandler.execute.resolves(
        success(detailJeuneQueryModel)
      )

      // When
      const expected = { ...detailJeuneQueryModel }
      delete expected.urlDossier
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(expected)
      expect(getDetailJeuneQueryHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune
        },
        unUtilisateurDecode()
      )
    })
    it('renvoie une 404 quand le jeune n"existe pas', async () => {
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
          motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ,
          commentaire: undefined
        })
        .resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(`/jeunes/id-jeune/archiver`)
        .set('authorization', unHeaderAuthorization())
        .send({ motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ })
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
        .send({ motif: ArchiveJeune.MotifSuppression.SORTIE_POSITIVE_DU_CEJ })
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
        .send({ motif: ArchiveJeune.MotifSuppression.AUTRE })
        //Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('renvoie une 204 si motif Autre sans commentaire', async () => {
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
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(success([]))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect([])
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

  describe('GET /jeunes/:idJeune/pole-emploi/actions', () => {
    const idJeune = '1'
    it('renvoit une 404 quand le jeune n"existe pas', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      getActionsPoleEmploiQueryHandler.execute.resolves(
        failure(new NonTrouveError('Jeune', '1'))
      )
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/pole-emploi/actions`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('retourne les rdv', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      getActionsPoleEmploiQueryHandler.execute.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/pole-emploi/actions`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect([])
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/pole-emploi/actions'
    )
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
              actions: []
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

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/home/demarches')
  })

  describe('PUT /jeunes/:idJeune/demarches/:idDemarche/statut', () => {
    const idJeune = '1'
    const idDemarche = 'demarche'
    const payload: UpdateStatutDemarchePayload = {
      statut: Demarche.Statut.REALISEE,
      dateFin: uneDate()
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
              dateFin: uneDate(),
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
        updateStatutDemarcheCommandHandler.execute
          .withArgs(
            {
              statut: payload.statut,
              dateFin: uneDate(),
              idJeune,
              idDemarche,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(failure(new ErreurHttp("C'est cassé", 400)))

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
      dateFin: uneDate()
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
              dateFin: payload.dateFin
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
              dateFin: payload.dateFin
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

  describe('GET /jeunes/:idJeune/actions', () => {
    const idJeune = '1'
    it('renvoie 206 quand la page est renseignée', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        page: 1,
        tri: 'date_croissante',
        statuts: ['done']
      }
      const actionsByJeuneOutput: ActionsByJeuneOutput = {
        actions: [],
        metadonnees: {
          nombreTotal: 0,
          nombreEnCours: 0,
          nombreTerminees: 0,
          nombreAnnulees: 0,
          nombrePasCommencees: 0,
          nombreActionsParPage: 10
        }
      }
      const expectedActions = success(actionsByJeuneOutput)
      getActionsByJeuneQueryHandler.execute.resolves(expectedActions)
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.PARTIAL_CONTENT)
        .expect(expectedActions.data.actions)
    })
    it("retourne 200 avec toutes les actions si la page n'est pas renseignée", async () => {
      // Given
      const queryActions = {
        idJeune: idJeune
      }
      const actionsByJeuneOutput: ActionsByJeuneOutput = {
        actions: [],
        metadonnees: {
          nombreTotal: 1,
          nombreEnCours: 2,
          nombreTerminees: 3,
          nombreAnnulees: 4,
          nombrePasCommencees: 5,
          nombreActionsParPage: 10
        }
      }
      const expectedActions = success(actionsByJeuneOutput)
      getActionsByJeuneQueryHandler.execute.resolves(expectedActions)
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.OK)
        .expect(expectedActions.data.actions)
        .expect(
          'x-total-count',
          expectedActions.data.metadonnees.nombreTotal.toString()
        )
        .expect(
          'x-statut-in_progress-count',
          expectedActions.data.metadonnees.nombreEnCours.toString()
        )
        .expect(
          'x-statut-done-count',
          expectedActions.data.metadonnees.nombreTerminees.toString()
        )
        .expect(
          'x-statut-canceled-count',
          expectedActions.data.metadonnees.nombreAnnulees.toString()
        )
        .expect(
          'x-statut-not_started-count',
          expectedActions.data.metadonnees.nombrePasCommencees.toString()
        )
        .expect(
          'x-page-size',
          expectedActions.data.metadonnees.nombreActionsParPage.toString()
        )
    })
    it('retourne 400 quand le paramètre page est au mauvais format', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        page: 'poi'
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('retourne 404 quand une failure non trouvé se produit', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        page: 2
      }
      getActionsByJeuneQueryHandler.execute.resolves(
        failure(new NonTrouveError('test'))
      )
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('retourne 400 quand le paramètre tri est au mauvais format', async () => {
      // Given
      const queryActions = {
        tri: 'atchoum'
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('retourne 400 quand le paramètre statuts est au mauvais format', async () => {
      // Given
      const queryActions = {
        statuts: ['à tes souhaits']
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
  })

  describe('PUT /jeunes/:idJeune/push-notification-token', () => {
    const idJeune = '1'
    const payload: PutNotificationTokenInput = {
      registration_token: 'token'
    }

    describe("quand c'est en succès", () => {
      it("met à jour le token et la version de l'app", async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateNotificationTokenCommandHandler.execute
          .withArgs(
            {
              idJeune,
              token: payload.registration_token,
              appVersion: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/push-notification-token`)
          .set('authorization', unHeaderAuthorization())
          .set('x-appversion', 'coucou')
          .send(payload)
          // Then
          .expect(HttpStatus.OK)
      })
      it("met à jour le token sans version de l'app", async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateNotificationTokenCommandHandler.execute
          .withArgs(
            {
              idJeune,
              token: payload.registration_token,
              appVersion: undefined
            },
            unUtilisateurDecode()
          )
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/push-notification-token`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.OK)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'put',
      '/jeunes/1/push-notification-token'
    )
  })
})
