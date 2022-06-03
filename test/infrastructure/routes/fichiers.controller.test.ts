import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { TelechargerFichierQueryHandler } from 'src/application/queries/telecharger-fichier.query.handler'
import * as request from 'supertest'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler,
  TeleverserFichierCommandOutput
} from '../../../src/application/commands/televerser-fichier.command.handler'
import { success } from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { uneImage } from '../../fixtures/fichier.fixture'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('FichiersController', () => {
  let telechargerFichierQueryHandler: StubbedClass<TelechargerFichierQueryHandler>
  let televerserFichierCommandHandler: StubbedClass<TeleverserFichierCommandHandler>
  let app: INestApplication

  before(async () => {
    telechargerFichierQueryHandler = stubClass(TelechargerFichierQueryHandler)
    televerserFichierCommandHandler = stubClass(TeleverserFichierCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(TelechargerFichierQueryHandler)
      .useValue(telechargerFichierQueryHandler)
      .overrideProvider(TeleverserFichierCommandHandler)
      .useValue(televerserFichierCommandHandler)
      .compile()
    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /fichiers/:idFichier', () => {
    it("retoune l'url du fichier + redirect", async () => {
      // Given
      const url = 'test'
      const idFichier = '15916d7e-f13a-4158-b7eb-3936aa933a0a'

      telechargerFichierQueryHandler.execute
        .withArgs({ idFichier }, unUtilisateurDecode())
        .resolves(success(url))

      // When
      await request(app.getHttpServer())
        .get(`/fichiers/${idFichier}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.TEMPORARY_REDIRECT)
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/fichiers')
  })

  describe('POST /fichiers', () => {
    it("renvoie l'id du fichier créé", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const idFichier = '15916d7e-f13a-4158-b7eb-3936aa933a0a'
      const image = uneImage()
      const command: TeleverserFichierCommand = {
        fichier: {
          buffer: image.buffer,
          mimeType: image.mimetype,
          name: image.originalname,
          size: image.size
        },
        jeunesIds: ['1'],
        createur: {
          id: utilisateur.id,
          type: utilisateur.type
        }
      }
      const commandOutput: TeleverserFichierCommandOutput = {
        id: idFichier,
        nom: 'image.jpg'
      }
      televerserFichierCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(success(commandOutput))

      // When
      await request(app.getHttpServer())
        .post('/fichiers')
        .field({
          jeunesIds: '1'
        })
        .attach('file', 'test/fixtures/image.jpg')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.CREATED)
        .expect({ id: idFichier, nom: 'image.jpg' })
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/fichiers')
  })
})
