import {
  UploadFileCommand,
  UploadFileCommandHandler,
  UploadFileCommandOutput
} from '../../../src/application/commands/upload-file.command.handler'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { success } from '../../../src/building-blocks/types/result'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { uneImage } from '../../fixtures/fichier.fixture'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('FilesController', () => {
  let uploadFileCommandHandler: StubbedClass<UploadFileCommandHandler>
  let app: INestApplication

  before(async () => {
    uploadFileCommandHandler = stubClass(UploadFileCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(UploadFileCommandHandler)
      .useValue(uploadFileCommandHandler)
      .compile()
    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /files', () => {
    it('renvoie l’id du fichier créé', async () => {
      // Given
      const idFile = '15916d7e-f13a-4158-b7eb-3936aa933a0a'
      const image = uneImage()
      const uploadFileCommand: UploadFileCommand = {
        file: {
          buffer: image.buffer,
          mimeType: image.mimetype,
          name: image.originalname,
          size: image.size
        },
        jeunesIds: ['1']
      }
      const commandOutput: UploadFileCommandOutput = {
        id: idFile,
        nom: 'image.jpg'
      }
      uploadFileCommandHandler.execute
        .withArgs(uploadFileCommand, unUtilisateurDecode())
        .resolves(success(commandOutput))

      // When
      await request(app.getHttpServer())
        .post('/files')
        .field({
          jeunesIds: '1'
        })
        .attach('file', 'test/fixtures/image.jpg')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.CREATED)
        // Then
        .expect({ id: idFile, nom: 'image.jpg' })
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/files')
  })
})
