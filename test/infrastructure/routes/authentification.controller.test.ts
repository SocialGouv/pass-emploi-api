import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  StructureUtilisateurAuth,
  TypeUtilisateurAuth,
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../../src/application/commands/update-utilisateur.command.handler'
import {
  ConseillerNonValide,
  NonTraitableError,
  NonTraitableReason,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import {
  GetUtilisateurQueryParams,
  PutUtilisateurPayload
} from '../../../src/infrastructure/routes/validation/authentification.inputs'
import { unUtilisateurQueryModel } from '../../fixtures/query-models/authentification.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import {
  GetUtilisateurQuery,
  GetUtilisateurQueryHandler
} from '../../../src/application/queries/get-utilisateur.query.handler'

let updateUtilisateurCommandHandler: StubbedClass<UpdateUtilisateurCommandHandler>
let getUtilisateurQueryHandler: StubbedClass<GetUtilisateurQueryHandler>

describe('AuthentificationController', () => {
  updateUtilisateurCommandHandler = stubClass(UpdateUtilisateurCommandHandler)
  getUtilisateurQueryHandler = stubClass(GetUtilisateurQueryHandler)
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    updateUtilisateurCommandHandler = app.get(UpdateUtilisateurCommandHandler)
    getUtilisateurQueryHandler = app.get(GetUtilisateurQueryHandler)
  })

  describe('PUT auth/users/:idUtilisateurAuth', () => {
    it('met à jour et retourne un utilisateur', async () => {
      // Given
      const utilisateur = unUtilisateurQueryModel({ username: 'test' })

      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.MILO,
        username: 'test'
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute.resolves(success(utilisateur))

      // When - Then
      const result = await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.OK)

      expect(
        updateUtilisateurCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command)
      expect(result.body).to.deep.equal(utilisateur)
    })
    it('met à jour et retourne un utilisateur BENEFICIAIRE FT', async () => {
      // Given
      const utilisateur = unUtilisateurQueryModel({ username: 'test' })

      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: 'BENEFICIAIRE',
        email: 'nils.tavernier@passemploi.com',
        structure: 'FRANCE_TRAVAIL',
        username: 'test'
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute.resolves(success(utilisateur))

      // When - Then
      const result = await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.OK)

      expect(
        updateUtilisateurCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command)
      expect(result.body).to.deep.equal(utilisateur)
    })

    it("retourne 404 quand le user n'existe pas", async () => {
      // Given
      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.MILO
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
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('retourne 422 quand Non Traitable', async () => {
      // Given
      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.MILO
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(
            new NonTraitableError('Utilisateur', command.idUtilisateurAuth)
          )
        )

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('retourne 422 quand Non Traitable MILO', async () => {
      // Given
      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.MILO
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(
            new NonTraitableError(
              'Utilisateur',
              command.idUtilisateurAuth,
              NonTraitableReason.UTILISATEUR_DEJA_MILO
            )
          )
        )

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('retourne 400 quand on veut créer un utilisateur mauvaise structure', async () => {
      // Given
      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: Authentification.Type.CONSEILLER,
        email: 'nils.tavernier@passemploi.com',
        structure: 'MILOU' as StructureUtilisateurAuth,
        username: 'test'
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
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand on veut créer un utilisateur Milo avec des champs manquants', async () => {
      // Given
      const body: PutUtilisateurPayload = {
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
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand on veut créer un utilisateur avec mauvais type', async () => {
      // Given
      const body: PutUtilisateurPayload = {
        nom: 'Tavernier',
        prenom: 'Nils',
        type: 'BENEF' as TypeUtilisateurAuth,
        email: 'nils.tavernier@passemploi.com',
        structure: Core.Structure.MILO,
        username: 'test'
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
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand on veut créer un utilisateur avec un email invalide', async () => {
      // Given
      const body: PutUtilisateurPayload = {
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
        .set({ 'X-API-KEY': 'api-key-keycloak' })
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
          .set({ 'X-API-KEY': 'api-key-keycloak-invalide' })
          .expect(HttpStatus.UNAUTHORIZED)

        expect(result.body).to.deep.equal({
          statusCode: 401,
          message: 'API KEY non valide',
          error: 'Unauthorized'
        })
      })
    })
  })
  describe('GET auth/users/:idAuthentification', () => {
    it('retourne un utilisateur', async () => {
      // Given
      const qp: GetUtilisateurQueryParams = {
        typeUtilisateur: Authentification.Type.CONSEILLER,
        structureUtilisateur: Core.Structure.MILO
      }
      const query: GetUtilisateurQuery = {
        ...qp,
        idAuthentification: 'test-sub'
      }
      const utilisateur = unUtilisateurQueryModel({ username: 'test' })
      getUtilisateurQueryHandler.execute
        .withArgs(query)
        .resolves(success(utilisateur))

      // When - Then
      const result = await request(app.getHttpServer())
        .get(`/auth/users/${query.idAuthentification}`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .query(qp)
        .expect(HttpStatus.OK)

      expect(result.body).to.deep.equal(utilisateur)
    })

    it("retourne 404 quand l'utilisateur n'existe pas", async () => {
      // Given
      const qp: GetUtilisateurQueryParams = {
        typeUtilisateur: Authentification.Type.CONSEILLER,
        structureUtilisateur: Core.Structure.MILO
      }
      const query: GetUtilisateurQuery = {
        ...qp,
        idAuthentification: 'test-sub'
      }
      getUtilisateurQueryHandler.execute
        .withArgs(query)
        .resolves(
          failure(new NonTrouveError('Utilisateur', query.idAuthentification))
        )

      // When - Then
      await request(app.getHttpServer())
        .get(`/auth/users/${query.idAuthentification}`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .query(qp)
        .expect(HttpStatus.NOT_FOUND)
    })

    it("retourne 400 quand la structure n'est pas admise", async () => {
      // Given
      const qp = {
        typeUtilisateur: Authentification.Type.CONSEILLER,
        structureUtilisateur: 'RSA'
      }

      // When - Then
      await request(app.getHttpServer())
        .get(`/auth/users/un-id`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .query(qp)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it("retourne 400 quand le type n'est pas admis", async () => {
      // Given
      const qp: GetUtilisateurQueryParams = {
        typeUtilisateur: Authentification.Type.SUPPORT,
        structureUtilisateur: Core.Structure.MILO
      }

      // When - Then
      await request(app.getHttpServer())
        .get(`/auth/users/un-id`)
        .set({ 'X-API-KEY': 'api-key-keycloak' })
        .query(qp)
        .expect(HttpStatus.BAD_REQUEST)
    })

    describe('est sécurisée', () => {
      it('retourne 401 API KEY non présente', async () => {
        // When - Then
        const result = await request(app.getHttpServer())
          .get(`/auth/users/fake-id`)
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
          .get(`/auth/users/fake-id`)
          .set({ 'X-API-KEY': 'api-key-invalide' })
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
