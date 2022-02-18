import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../../src/application/commands/update-utilisateur.command.handler'
import {
  NonTrouveError,
  ConseillerNonValide
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { UpdateUserPayload } from '../../../src/infrastructure/routes/validation/authentification.inputs'
import { unUtilisateurQueryModel } from '../../fixtures/query-models/authentification.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

let updateUtilisateurCommandHandler: StubbedClass<UpdateUtilisateurCommandHandler>

describe('AuthentificationController', () => {
  updateUtilisateurCommandHandler = stubClass(UpdateUtilisateurCommandHandler)
  let app: INestApplication

  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(UpdateUtilisateurCommandHandler)
      .useValue(updateUtilisateurCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('PUT auth/users/:idUtilisateurAuth', () => {
    it('met à jour et retourne un utilisateur', async () => {
      // Given
      const utilisateur = unUtilisateurQueryModel()

      const body: UpdateUserPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.MILO,
        federatedToken: 'le-token-milo'
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(success(utilisateur))

      // When - Then
      const result = await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'ceci-est-une-api-key' })
        .send(body)
        .expect(HttpStatus.OK)

      expect(result.body).to.deep.equal(utilisateur)
    })

    it("retourne 404 quand le user n'existe pas", async () => {
      // Given
      const body: UpdateUserPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.PASS_EMPLOI
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(new NonTrouveError('Utilisateur', command.idUtilisateurAuth))
        )

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'ceci-est-une-api-key' })
        .send(body)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('retourne 400 quand on veut créer un utilisateur Milo avec des champs manquants', async () => {
      // Given
      const body: UpdateUserPayload = {
        type: Authentification.Type.CONSEILLER,
        structure: Core.Structure.MILO
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new ConseillerNonValide()))

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'ceci-est-une-api-key' })
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand on veut créer un utilisateur avec un email invalide', async () => {
      // Given
      const body: UpdateUserPayload = {
        email: 'plop',
        type: Authentification.Type.CONSEILLER,
        structure: Core.Structure.MILO
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new ConseillerNonValide()))

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'ceci-est-une-api-key' })
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })

    describe('est sécurisée', () => {
      it('retourne 401 API KEY non présente', async () => {
        // When - Then
        const result = await request(app.getHttpServer())
          .put(`/auth/users/fake-id`)
          .expect(HttpStatus.UNAUTHORIZED)

        expect(result.body).to.deep.equal({
          statusCode: 401,
          message: "API KEY non présent dans le header 'X-API-KEY'",
          error: 'Unauthorized'
        })
      })
      it('retourne 401 API KEY non valide', async () => {
        // When - Then
        const result = await request(app.getHttpServer())
          .put(`/auth/users/fake-id`)
          .set({ 'X-API-KEY': 'ceci-est-une-api-key-invalide' })
          .expect(HttpStatus.UNAUTHORIZED)

        expect(result.body).to.deep.equal({
          statusCode: 401,
          message: 'API KEY non valide',
          error: 'Unauthorized'
        })
      })
    })
  })
  describe('POST auth/firebase/token', () => {
    ensureUserAuthenticationFailsIfInvalid('post', '/auth/firebase/token')
  })
})
