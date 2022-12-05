import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/create-liste-de-diffusion.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('ListesDeDiffusionController', () => {
  let createListeDeDiffusionCommandHandler: StubbedClass<CreateListeDeDiffusionCommandHandler>
  let app: INestApplication

  before(async () => {
    createListeDeDiffusionCommandHandler = stubClass(
      CreateListeDeDiffusionCommandHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateListeDeDiffusionCommandHandler)
      .useValue(createListeDeDiffusionCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /conseillers/{idConseiller}/listes-de-diffusion', () => {
    describe('quand la commande est en succès', () => {
      it('retourne une 201', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const idsBeneficiaires: string[] = []
        const command: CreateListeDeDiffusionCommand = {
          idConseiller,
          titre: '',
          idsBeneficiaires
        }
        createListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/listes-de-diffusion`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires })
          // Then
          .expect(HttpStatus.CREATED)
      })
    })
    describe('quand la commande retourne échoue en NonTrouve', () => {
      it('retourne une 404', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const idsBeneficiaires: string[] = []
        const command: CreateListeDeDiffusionCommand = {
          idConseiller,
          titre: '',
          idsBeneficiaires
        }
        createListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('Conseiller', idConseiller)))

        // When
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/listes-de-diffusion`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires })
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    describe('quand le payload est au mauvais format', () => {
      it('retourne une 400', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const idsBeneficiaires = 'un-payload-du-mauvais-type'

        // When
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/listes-de-diffusion`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/2/listes-de-diffusion'
    )
  })
})
