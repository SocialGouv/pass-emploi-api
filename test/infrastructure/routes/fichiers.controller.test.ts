import { HttpStatus, INestApplication } from '@nestjs/common'
import {
  SupprimerFichierCommand,
  SupprimerFichierCommandHandler
} from 'src/application/commands/supprimer-fichier.command.handler'
import { TelechargerFichierQueryHandler } from 'src/application/queries/telecharger-fichier.query.handler'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError,
  RessourceIndisponibleError
} from 'src/building-blocks/types/domain-error'
import * as request from 'supertest'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler,
  TeleverserFichierCommandOutput
} from '../../../src/application/commands/televerser-fichier.command.handler'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { uneImage, unFichierMetadata } from '../../fixtures/fichier.fixture'
import { StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('FichiersController', () => {
  let telechargerFichierQueryHandler: StubbedClass<TelechargerFichierQueryHandler>
  let televerserFichierCommandHandler: StubbedClass<TeleverserFichierCommandHandler>
  let supprimerFichierCommandHandler: StubbedClass<SupprimerFichierCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    telechargerFichierQueryHandler = app.get(TelechargerFichierQueryHandler)
    televerserFichierCommandHandler = app.get(TeleverserFichierCommandHandler)
    supprimerFichierCommandHandler = app.get(SupprimerFichierCommandHandler)
  })

  describe('GET /fichiers/:idFichier', () => {
    it("retoune l'url du fichier + redirect", async () => {
      // Given
      const url = 'test'
      const idFichier = '15916d7e-f13a-4158-b7eb-3936aa933a0a'

      telechargerFichierQueryHandler.execute
        .withArgs({ idFichier }, unUtilisateurDecode())
        .resolves(success({ metadata: unFichierMetadata(), url }))

      // When
      await request(app.getHttpServer())
        .get(`/fichiers/${idFichier}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.TEMPORARY_REDIRECT)
        .expect('Location', url)
    })
    it('retoune 410 quand la ressource est indisponible', async () => {
      // Given
      const idFichier = '15916d7e-f13a-4158-b7eb-3936aa933a0a'

      telechargerFichierQueryHandler.execute
        .withArgs({ idFichier }, unUtilisateurDecode())
        .resolves(failure(new RessourceIndisponibleError('message')))

      // When
      await request(app.getHttpServer())
        .get(`/fichiers/${idFichier}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.GONE)
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/fichiers/1')
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
        listesDeDiffusionIds: undefined,
        idMessage: 'id-message'
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
          jeunesIds: '1',
          nom: 'image.jpg',
          idMessage: 'id-message'
        })
        .attach('fichier', 'test/fixtures/image.jpg')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.CREATED)
        .expect({ id: idFichier, nom: 'image.jpg' })
    })

    it('renvoie une erreur 400 quand la validation du fichier echoue', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const image = uneImage()
      const command: TeleverserFichierCommand = {
        fichier: {
          buffer: image.buffer,
          mimeType: image.mimetype,
          name: image.originalname,
          size: image.size
        },
        jeunesIds: ['1'],
        listesDeDiffusionIds: undefined,
        idMessage: undefined
      }
      televerserFichierCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(failure(new MauvaiseCommandeError('invalide')))

      // When
      await request(app.getHttpServer())
        .post('/fichiers')
        .field({
          jeunesIds: '1'
        })
        .attach('fichier', 'test/fixtures/image.jpg')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid('post', '/fichiers')
  })

  describe('DELETE /fichiers/:idFichier', () => {
    it('renvoie une 204', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const idFichier = '15916d7e-f13a-4158-b7eb-3936aa933a0a'
      const command: SupprimerFichierCommand = {
        idFichier
      }
      supprimerFichierCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(emptySuccess())

      // When
      await request(app.getHttpServer())
        .delete(`/fichiers/${idFichier}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NO_CONTENT)
    })
    it("renvoie une erreur 403 quand l'utilisateur n'est pas autorisé", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const idFichier = '15916d7e-f13a-4158-b7eb-3936aa933a0a'
      const command: SupprimerFichierCommand = {
        idFichier
      }
      supprimerFichierCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(failure(new DroitsInsuffisants()))

      // When
      await request(app.getHttpServer())
        .delete(`/fichiers/${idFichier}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })
    ensureUserAuthenticationFailsIfInvalid('delete', '/fichiers/1')
  })
})
