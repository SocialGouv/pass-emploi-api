import { HttpStatus, INestApplication } from '@nestjs/common'
import { Action } from 'src/domain/action'
import * as request from 'supertest'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../../src/application/commands/send-notification-nouveau-message.command.handler'
import { GetDossierMiloJeuneQueryHandler } from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { CreateActionPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unDossierMilo } from '../../fixtures/milo.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('ConseillersController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let sendNotificationNouveauMessage: StubbedClass<SendNotificationNouveauMessageCommandHandler>
  let getDossierMiloJeuneQueryHandler: StubbedClass<GetDossierMiloJeuneQueryHandler>
  let app: INestApplication

  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    sendNotificationNouveauMessage = stubClass(
      SendNotificationNouveauMessageCommandHandler
    )
    getDossierMiloJeuneQueryHandler = stubClass(GetDossierMiloJeuneQueryHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(SendNotificationNouveauMessageCommandHandler)
      .useValue(sendNotificationNouveauMessage)
      .overrideProvider(GetDossierMiloJeuneQueryHandler)
      .useValue(getDossierMiloJeuneQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/action', () => {
    it("renvoie l'id de l'action créée", async () => {
      // Given
      const actionPayload: CreateActionPayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire'
      }
      const idAction = '15916d7e-f13a-4158-b7eb-3936aa937a0a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When - Then
      await request(app.getHttpServer())
        .post('/conseillers/1/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayload)
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })

      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: '1',
          typeCreateur: Action.TypeCreateur.CONSEILLER,
          commentaire: 'Ceci est un commentaire'
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/jeunes/ABCDE/action'
    )
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/notify-message', () => {
    describe('quand tout va bien', () => {
      it('renvoie void', async () => {
        // Given
        sendNotificationNouveauMessage.execute
          .withArgs({
            idConseiller: '1',
            idJeune: 'ABCDE'
          })
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/1/jeunes/ABCDE/notify-message')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)

        expect(
          sendNotificationNouveauMessage.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: 'ABCDE',
            idConseiller: '1'
          },
          unUtilisateurDecode()
        )
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        const result = failure(new NonTrouveError('Jeune', 'ZIZOU'))
        sendNotificationNouveauMessage.execute
          .withArgs({
            idConseiller: '1',
            idJeune: 'ZIZOU'
          })
          .resolves(result)

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/1/jeunes/ZIZOU/notify-message')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe("quand le conseiller n'est pas lié au jeune", () => {
      it('renvoie 404', async () => {
        // Given
        const result = failure(
          new JeuneNonLieAuConseillerError('JACQUET', 'ABCDE')
        )
        sendNotificationNouveauMessage.execute
          .withArgs({
            idConseiller: 'JACQUET',
            idJeune: 'ABCDE'
          })
          .resolves(result)

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/JACQUET/jeunes/ABCDE/notify-message')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/jeunes/ABCDE/notify-message'
    )
  })

  describe('GET /conseillers/milo/dossiers/:idDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le dossier', async () => {
        // Given
        getDossierMiloJeuneQueryHandler.execute
          .withArgs({ idDossier: '1' }, unUtilisateurDecode())
          .resolves(unDossierMilo())

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/dossiers/1')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(unDossierMilo()))
      })
    })

    describe("quand le dossier n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        // Given
        getDossierMiloJeuneQueryHandler.execute
          .withArgs({ idDossier: '2' }, unUtilisateurDecode())
          .resolves(undefined)

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/dossiers/2')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/dossiers/2'
    )
  })
})
