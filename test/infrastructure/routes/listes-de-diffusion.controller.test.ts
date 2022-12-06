import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/create-liste-de-diffusion.command.handler'
import { DeleteListeDeDiffusionCommandHandler } from '../../../src/application/commands/delete-liste-de-diffusion.command.handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { GetListesDeDiffusionDuConseillerQueryHandler } from '../../../src/application/queries/get-listes-de-diffusion-du-conseiller.query.handler.db'
import {
  UpdateListeDeDiffusionCommand,
  UpdateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/update-liste-de-diffusion.command.handler'

describe('ListesDeDiffusionController', () => {
  let createListeDeDiffusionCommandHandler: StubbedClass<CreateListeDeDiffusionCommandHandler>
  let updateListeDeDiffusionCommandHandler: StubbedClass<UpdateListeDeDiffusionCommandHandler>
  let getListesDeDiffusionQueryHandler: StubbedClass<GetListesDeDiffusionDuConseillerQueryHandler>
  let deleteListeDeDiffusionCommandHandler: StubbedClass<DeleteListeDeDiffusionCommandHandler>
  let app: INestApplication

  before(async () => {
    createListeDeDiffusionCommandHandler = stubClass(
      CreateListeDeDiffusionCommandHandler
    )
    updateListeDeDiffusionCommandHandler = stubClass(
      UpdateListeDeDiffusionCommandHandler
    )
    getListesDeDiffusionQueryHandler = stubClass(
      GetListesDeDiffusionDuConseillerQueryHandler
    )
    deleteListeDeDiffusionCommandHandler = stubClass(
      DeleteListeDeDiffusionCommandHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateListeDeDiffusionCommandHandler)
      .useValue(createListeDeDiffusionCommandHandler)
      .overrideProvider(UpdateListeDeDiffusionCommandHandler)
      .useValue(updateListeDeDiffusionCommandHandler)
      .overrideProvider(GetListesDeDiffusionDuConseillerQueryHandler)
      .useValue(getListesDeDiffusionQueryHandler)
      .overrideProvider(DeleteListeDeDiffusionCommandHandler)
      .useValue(deleteListeDeDiffusionCommandHandler)
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

  describe('PUT /listes-de-diffusion/{idListe}', () => {
    describe('quand la commande est en succès', () => {
      it('retourne une 200', async () => {
        // Given
        const idsBeneficiaires: string[] = []
        const idListe = 'un-id-liste'
        const command: UpdateListeDeDiffusionCommand = {
          id: idListe,
          titre: 'un titre',
          idsBeneficiaires
        }
        updateListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/listes-de-diffusion/${idListe}`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: 'un titre', idsBeneficiaires })
          // Then
          .expect(HttpStatus.OK)
      })
    })
    describe('quand la commande retourne échoue en NonTrouve', () => {
      it('retourne une 404', async () => {
        // Given
        const idsBeneficiaires: string[] = []
        const idListe = 'un-id-liste'
        const command: UpdateListeDeDiffusionCommand = {
          id: idListe,
          titre: 'un titre',
          idsBeneficiaires
        }
        updateListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('ListeDeDiffusion')))

        // When
        await request(app.getHttpServer())
          .put(`/listes-de-diffusion/${idListe}`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: 'un titre', idsBeneficiaires })
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    describe('quand le payload est au mauvais format', () => {
      it('retourne une 400', async () => {
        // When
        await request(app.getHttpServer())
          .put('/listes-de-diffusion/1')
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires: 'un-payload-du-mauvais-type' })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('put', '/listes-de-diffusion/1')
  })

  describe('GET /conseillers/{idConseiller}/listes-de-diffusion', () => {
    it('retourne les liste de diffusion quand la query est en succès', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      getListesDeDiffusionQueryHandler.execute.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(`/conseillers/${idConseiller}/listes-de-diffusion`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect([])
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/2/listes-de-diffusion'
    )
    it('retourne une 403 quand l‘utilisateur n‘a pas les droits', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      getListesDeDiffusionQueryHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When
      await request(app.getHttpServer())
        .get(`/conseillers/${idConseiller}/listes-de-diffusion`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })
  })

  describe('DELETE /listes-de-diffusion/{idListeDeDiffusion}', () => {
    it('supprime la liste de diffusion', async () => {
      // Given
      deleteListeDeDiffusionCommandHandler.execute.resolves(emptySuccess())

      // When
      await request(app.getHttpServer())
        .delete('/listes-de-diffusion/idListeDeDiffusion')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NO_CONTENT)

      expect(
        deleteListeDeDiffusionCommandHandler.execute
      ).to.have.been.calledOnceWith({
        idListeDeDiffusion: 'idListeDeDiffusion'
      })
    })

    it('retourne une 403 quand l‘utilisateur n‘a pas les droits', async () => {
      // Given
      deleteListeDeDiffusionCommandHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When
      await request(app.getHttpServer())
        .delete(`/listes-de-diffusion/idListeDeDiffusion`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'delete',
      '/listes-de-diffusion/idListeDeDiffusion'
    )
  })
})
