import { HttpStatus, INestApplication } from '@nestjs/common'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { CreateEvenementCommandHandler } from '../../../src/application/commands/create-evenement.command.handler'
import { Evenement } from '../../../src/domain/evenement'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { CreateEvenementPayload } from '../../../src/infrastructure/routes/validation/evenements.inputs'

describe('EvenementsController', () => {
  let createEvenementCommandHandler: StubbedClass<CreateEvenementCommandHandler>
  let app: INestApplication

  before(async () => {
    createEvenementCommandHandler = stubClass(CreateEvenementCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateEvenementCommandHandler)
      .useValue(createEvenementCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /evenements', () => {
    it("crée l'évènement quand l'utilisateur a bien l'authorisation", async () => {
      // Given
      const createEvenementPayload: CreateEvenementPayload = {
        type: Evenement.Type.OFFRE_EMPLOI_PARTAGEE,
        emetteur: {
          id: '1',
          type: Authentification.Type.CONSEILLER,
          structure: Core.Structure.MILO
        }
      }

      // When
      await request(app.getHttpServer())
        .post('/evenements')
        .set('authorization', unHeaderAuthorization())
        .send(createEvenementPayload)

        // Then
        .expect(HttpStatus.CREATED)
      expect(
        createEvenementCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          type: Evenement.Type.OFFRE_EMPLOI_PARTAGEE,
          emetteur: {
            id: '1',
            type: Authentification.Type.CONSEILLER,
            structure: Core.Structure.MILO
          }
        },
        unUtilisateurDecode()
      )
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/evenements')
  })
})
