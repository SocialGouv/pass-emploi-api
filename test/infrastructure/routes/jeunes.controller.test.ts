import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { TransfererJeunesConseillerCommandHandler } from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { Core } from 'src/domain/core'
import { TransfererConseillerPayload } from 'src/infrastructure/routes/validation/jeunes.inputs'
import * as request from 'supertest'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi.command.handler'
import { DeleteJeuneCommandHandler } from '../../../src/application/commands/delete-jeune.command.handler'
import { GetActionsJeunePoleEmploiQueryHandler } from '../../../src/application/queries/get-actions-jeune-pole-emploi.query.handler'
import { GetConseillersJeuneQueryHandler } from '../../../src/application/queries/get-conseillers-jeune.query.handler'
import { GetDetailJeuneQueryHandler } from '../../../src/application/queries/get-detail-jeune.query.handler'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../../src/application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from '../../../src/application/queries/get-rendez-vous-jeune.query.handler'
import { DetailJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-models'
import {
  DomainError,
  DroitsInsuffisants,
  FavoriExisteDejaError,
  FavoriNonTrouveError,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
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
import { AddFavoriOffresEmploiPayload } from '../../../src/infrastructure/routes/validation/favoris.inputs'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { unConseillerJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
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
  let addFavoriOffreEmploiCommandHandler: StubbedClass<AddFavoriOffreEmploiCommandHandler>
  let deleteFavoriOffreEmploiCommandHandler: StubbedClass<DeleteFavoriOffreEmploiCommandHandler>
  let getDetailJeuneQueryHandler: StubbedClass<GetDetailJeuneQueryHandler>
  let getConseillersJeuneQueryHandler: StubbedClass<GetConseillersJeuneQueryHandler>
  let transfererJeunesConseillerCommandHandler: StubbedClass<TransfererJeunesConseillerCommandHandler>
  let deleteJeuneCommandHandler: StubbedClass<DeleteJeuneCommandHandler>
  let getRendezVousJeuneQueryHandler: StubbedClass<GetRendezVousJeuneQueryHandler>
  let getRendezVousJeunePoleEmploiQueryHandler: StubbedClass<GetRendezVousJeunePoleEmploiQueryHandler>
  let getActionsPoleEmploiQueryHandler: StubbedClass<GetActionsJeunePoleEmploiQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    addFavoriOffreEmploiCommandHandler = stubClass(
      AddFavoriOffreEmploiCommandHandler
    )
    deleteFavoriOffreEmploiCommandHandler = stubClass(
      DeleteFavoriOffreEmploiCommandHandler
    )
    getDetailJeuneQueryHandler = stubClass(GetDetailJeuneQueryHandler)
    transfererJeunesConseillerCommandHandler = stubClass(
      TransfererJeunesConseillerCommandHandler
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

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(AddFavoriOffreEmploiCommandHandler)
      .useValue(addFavoriOffreEmploiCommandHandler)
      .overrideProvider(DeleteFavoriOffreEmploiCommandHandler)
      .useValue(deleteFavoriOffreEmploiCommandHandler)
      .overrideProvider(GetDetailJeuneQueryHandler)
      .useValue(getDetailJeuneQueryHandler)
      .overrideProvider(TransfererJeunesConseillerCommandHandler)
      .useValue(transfererJeunesConseillerCommandHandler)
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
    it('transfere les jeunes', async () => {
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
          idsJeune: ['1'],
          structure: Core.Structure.MILO
        },
        unUtilisateurDecode()
      )
    })

    it("renvoie un code 403 si l'utilisateur n'est pas superviseur", async () => {
      // Given
      transfererJeunesConseillerCommandHandler.execute.rejects(
        new DroitsInsuffisants()
      )

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/transferer')
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
    })

    it("renvoie un code 403 si un jeune n'est pas lié au conseiller", async () => {
      // Given
      transfererJeunesConseillerCommandHandler.execute.resolves(
        failure(new JeuneNonLieAuConseillerError('1', '1'))
      )

      // When - Then
      await request(app.getHttpServer())
        .post('/jeunes/transferer')
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
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
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.NOT_FOUND
        })
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
          statusCode: HttpStatus.BAD_REQUEST
        })
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/action')
  })

  describe('POST /jeunes/:idJeune/favori', () => {
    const offreEmploi = uneOffreEmploi()
    const command: AddFavoriOffreEmploiCommand = {
      idJeune: 'ABCDE',
      offreEmploi: offreEmploi
    }

    const payload: AddFavoriOffresEmploiPayload = {
      idOffre: offreEmploi.id,
      nomEntreprise: offreEmploi.nomEntreprise,
      duree: offreEmploi.duree,
      titre: offreEmploi.titre,
      alternance: offreEmploi.alternance,
      typeContrat: offreEmploi.typeContrat,
      localisation: offreEmploi.localisation
    }
    it('crée un favori', async () => {
      // Given
      addFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/favori')
        .set('authorization', unHeaderAuthorization())
        .send(payload)

        // Then
        .expect(HttpStatus.CREATED)
      expect(
        addFavoriOffreEmploiCommandHandler.execute
      ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
    })
    it('renvoie une 409 (Conflict) quand l"offre n"existe pas', async () => {
      // Given
      addFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(
            new FavoriExisteDejaError(command.idJeune, command.offreEmploi.id)
          )
        )

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/favori')
        .set('authorization', unHeaderAuthorization())
        .send(payload)

        // Then
        .expect(HttpStatus.CONFLICT)
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/favori')
  })

  describe('DELETE /jeunes/:idJeune/favori/:idOffreEmploi', () => {
    const offreEmploi = uneOffreEmploi()
    const jeune = unJeune()
    const command: DeleteFavoriOffreEmploiCommand = {
      idJeune: jeune.id,
      idOffreEmploi: offreEmploi.id
    }
    it('supprime le favori', async () => {
      //Given
      deleteFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/favori/${offreEmploi.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)
      expect(
        deleteFavoriOffreEmploiCommandHandler.execute
      ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
    })
    it('renvoie une 404(NOT FOUND) si le favori n"existe pas', async () => {
      //Given
      deleteFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(
            new FavoriNonTrouveError(command.idJeune, command.idOffreEmploi)
          )
        )

      const expectedMessageJson = {
        code: 'FAVORI_NON_TROUVE',
        message: `Le Favori du jeune ${command.idJeune} correspondant à l'offre ${command.idOffreEmploi} n'existe pas`
      }
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/favori/${offreEmploi.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedMessageJson)
    })
    ensureUserAuthenticationFailsIfInvalid('delete', '/jeunes/ABCDE/favori/123')
  })

  describe('GET /jeunes/:idJeune', () => {
    const idJeune = '1'
    it('renvoit le jeune quand il existe', async () => {
      // Given
      const detailJeuneQueryModel: DetailJeuneQueryModel = {
        id: idJeune,
        firstName: 'Kenji',
        lastName: 'Tavernier',
        email: 'kenji.tavernier@email.fr',
        creationDate: 'une_date',
        isActivated: true,
        conseiller: unConseillerJeuneQueryModel()
      }
      getDetailJeuneQueryHandler.execute.resolves(detailJeuneQueryModel)

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(detailJeuneQueryModel)
      expect(getDetailJeuneQueryHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune
        },
        unUtilisateurDecode()
      )
    })
    it('renvoit une 404 quand le jeune n"existe pas', async () => {
      // Given
      getDetailJeuneQueryHandler.execute.resolves(undefined)
      const expectedResponseJson = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Jeune ${idJeune} not found`
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(expectedResponseJson)
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
    it("renvoit l'historique des conseillers quand il existe", async () => {
      // Given
      getConseillersJeuneQueryHandler.execute.resolves([])

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
    it('renvoit une 404 quand le jeune n"existe pas', async () => {
      // Given
      getConseillersJeuneQueryHandler.execute.resolves(undefined)
      const expectedResponseJson = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Jeune ${idJeune} not found`
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/conseillers`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(expectedResponseJson)
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
    it('supprime le jeune', async () => {
      //Given
      deleteJeuneCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)

      expect(deleteJeuneCommandHandler.execute).to.have.be.calledWithExactly(
        {
          idConseiller: 'bcd60403-5f10-4a16-a660-2099d79ebd66',
          idJeune: 'id-jeune'
        },
        unUtilisateurDecode()
      )
    })

    it("renvoie une 403 si l'utilisateur n'a pas les droits", async () => {
      //Given
      deleteJeuneCommandHandler.execute.rejects(new DroitsInsuffisants())

      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/id-jeune`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.FORBIDDEN)
    })

    it("renvoie une 404 si une ressource n'existe pas", async () => {
      //Given
      deleteJeuneCommandHandler.execute.resolves(
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
      deleteJeuneCommandHandler.execute.resolves(
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
      deleteJeuneCommandHandler.execute.resolves(
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
      deleteJeuneCommandHandler.execute.resolves(
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

  describe('GET /jeunes/:idJeune/rendez-vous', () => {
    const idJeune = '1'
    describe("quand c'est un jeune pole-emploi", () => {
      it('renvoit une 404 quand le jeune n"existe pas', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', '1'))
        )
        const expectedResponseJson = {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Jeune ${idJeune} non trouvé(e)`
        }
        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(expectedResponseJson)
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

    describe("quand ce n'est un jeune pole-emploi", () => {
      it('renvoit une 404 quand le jeune n"existe pas', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', '1'))
        )
        const expectedResponseJson = {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Jeune ${idJeune} non trouvé(e)`
        }
        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(expectedResponseJson)
      })
      it('retourne les rdv', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(success([]))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect([])
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
      const expectedResponseJson = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Jeune ${idJeune} non trouvé(e)`
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/pole-emploi/actions`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(expectedResponseJson)
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
})
