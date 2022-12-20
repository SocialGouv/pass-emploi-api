import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import {
  EnvoyerMessageGroupeCommand,
  EnvoyerMessageGroupeCommandHandler
} from '../../../src/application/commands/envoyer-message-groupe.command.handler'
import { EnvoyerMessagePayload } from '../../../src/infrastructure/routes/validation/messages.input'

describe('MessagesController', () => {
  let envoyerMessageGroupeCommandHandler: StubbedClass<EnvoyerMessageGroupeCommandHandler>
  let app: INestApplication

  before(async () => {
    envoyerMessageGroupeCommandHandler = stubClass(
      EnvoyerMessageGroupeCommandHandler
    )
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(EnvoyerMessageGroupeCommandHandler)
      .useValue(envoyerMessageGroupeCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /messages', () => {
    const command: EnvoyerMessageGroupeCommand = {
      idsBeneficiaires: ['jeune-1', 'jeune-2'],
      idsListesDeDiffusion: undefined,
      message: 'un message',
      iv: '123456',
      idConseiller: '41',
      infoPieceJointe: {
        id: 'id',
        nom: 'nom'
      }
    }

    const payload: EnvoyerMessagePayload = {
      message: 'un message',
      iv: '123456',
      idsBeneficiaires: ['jeune-1', 'jeune-2'],
      idConseiller: '41',
      infoPieceJointe: {
        id: 'id',
        nom: 'nom'
      }
    }
    it('envoie des messages', async () => {
      // Given
      envoyerMessageGroupeCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())

      // When
      await request(app.getHttpServer())
        .post('/messages')
        .set('authorization', unHeaderAuthorization())
        .send(payload)

        // Then
        .expect(HttpStatus.CREATED)
      expect(
        envoyerMessageGroupeCommandHandler.execute
      ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
    })
    ensureUserAuthenticationFailsIfInvalid('POST', '/messages')
  })
})
