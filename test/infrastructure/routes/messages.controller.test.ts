import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import {
  EnvoyerMessageGroupeCommand,
  EnvoyerMessageGroupeCommandHandler
} from '../../../src/application/commands/envoyer-message-groupe.command.handler'
import { EnvoyerMessagePayload } from '../../../src/infrastructure/routes/validation/messages.input'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('MessagesController', async () => {
  let envoyerMessageGroupeCommandHandler: StubbedClass<EnvoyerMessageGroupeCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    envoyerMessageGroupeCommandHandler = app.get(
      EnvoyerMessageGroupeCommandHandler
    )
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
