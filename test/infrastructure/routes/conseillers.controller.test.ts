import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../../src/application/commands/send-notification-nouveau-message.command.handler'
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
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'

describe('ConseillersController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let sendNotificationNouveauMessage: StubbedClass<SendNotificationNouveauMessageCommandHandler>
  let app: INestApplication

  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    sendNotificationNouveauMessage = stubClass(
      SendNotificationNouveauMessageCommandHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(SendNotificationNouveauMessageCommandHandler)
      .useValue(sendNotificationNouveauMessage)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/action', () => {
    it("renvoie l'id de l'action créée", () => {
      // Given
      const actionPayload: CreateActionPayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire'
      }
      const idAction = '15916d7e-f13a-4158-b7eb-3936aa937a0a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When - Then
      return request(app.getHttpServer())
        .post('/conseillers/1/jeunes/ABCDE/action')
        .send(actionPayload)
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
    })
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/notify-message', () => {
    describe('quand tout va bien', () => {
      it('renvoie void', () => {
        // Given
        sendNotificationNouveauMessage.execute
          .withArgs({ idConseiller: '1', idJeune: 'ABCDE' })
          .resolves(emptySuccess())

        // When - Then
        return request(app.getHttpServer())
          .post('/conseillers/1/jeunes/ABCDE/notify-message')
          .expect(HttpStatus.CREATED)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie 404', () => {
        // Given
        const result = failure(new NonTrouveError('Jeune', 'ZIZOU'))
        sendNotificationNouveauMessage.execute
          .withArgs({ idConseiller: '1', idJeune: 'ZIZOU' })
          .resolves(result)

        // When - Then
        return request(app.getHttpServer())
          .post('/conseillers/1/jeunes/ZIZOU/notify-message')
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe("quand le conseiller n'est pas lié au jeune", () => {
      it('renvoie 404', () => {
        // Given
        const result = failure(
          new JeuneNonLieAuConseillerError('JACQUET', 'ABCDE')
        )
        sendNotificationNouveauMessage.execute
          .withArgs({ idConseiller: 'JACQUET', idJeune: 'ABCDE' })
          .resolves(result)

        // When - Then
        return request(app.getHttpServer())
          .post('/conseillers/JACQUET/jeunes/ABCDE/notify-message')
          .expect(HttpStatus.NOT_FOUND)
      })
    })
  })
})
