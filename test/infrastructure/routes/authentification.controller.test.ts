import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../../src/application/commands/update-utilisateur.command.handler'
import {
  NonTrouveError,
  UtilisateurMiloNonValide
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { UpdateUserPayload } from '../../../src/infrastructure/routes/validation/authentification.inputs'
import { unUtilisateurQueryModel } from '../../fixtures/query-models/authentification.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'

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
        structure: Authentification.Structure.MILO,
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
        structure: Authentification.Structure.PASS_EMPLOI
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
        .send(body)
        .expect(HttpStatus.NOT_FOUND)
    })

    it('retourne 400 quand on veut créer un utilisateur Milo avec des champs manquants', async () => {
      // Given
      const body: UpdateUserPayload = {
        type: Authentification.Type.CONSEILLER,
        structure: Authentification.Structure.MILO
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new UtilisateurMiloNonValide()))

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand on veut créer un utilisateur avec un email invalide', async () => {
      // Given
      const body: UpdateUserPayload = {
        email: 'plop',
        type: Authentification.Type.CONSEILLER,
        structure: Authentification.Structure.MILO
      }

      const command: UpdateUtilisateurCommand = {
        ...body,
        idUtilisateurAuth: 'nilstavernier'
      }

      updateUtilisateurCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new UtilisateurMiloNonValide()))

      // When - Then
      await request(app.getHttpServer())
        .put(`/auth/users/${command.idUtilisateurAuth}`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })
  })
})
