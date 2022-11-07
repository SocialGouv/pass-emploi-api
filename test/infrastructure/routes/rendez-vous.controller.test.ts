import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import { UpdateRendezVousPayload } from 'src/infrastructure/routes/validation/rendez-vous.inputs'

describe('RendezvousController', () => {
  let deleteRendezVousCommandHandler: StubbedClass<DeleteRendezVousCommandHandler>
  let updateRendezVousCommandHandler: StubbedClass<UpdateRendezVousCommandHandler>
  let app: INestApplication

  before(async () => {
    deleteRendezVousCommandHandler = stubClass(DeleteRendezVousCommandHandler)
    updateRendezVousCommandHandler = stubClass(UpdateRendezVousCommandHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(DeleteRendezVousCommandHandler)
      .useValue(deleteRendezVousCommandHandler)
      .overrideProvider(UpdateRendezVousCommandHandler)
      .useValue(updateRendezVousCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('DELETE rendezvous/:idRendezVous', () => {
    const jeune = unJeune()
    const rendezvous = unRendezVous({ jeunes: [jeune] })
    const command: DeleteRendezVousCommand = {
      idRendezVous: rendezvous.id
    }
    it('supprime le rendez-vous', async () => {
      // Given
      deleteRendezVousCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())
      // When
      await request(app.getHttpServer())
        .delete(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NO_CONTENT)
      expect(
        deleteRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
    })
    it('renvoie une 404 si le rendez-vous n"existe pas', async () => {
      // Given
      deleteRendezVousCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(new NonTrouveError('Rendez-vous', command.idRendezVous))
        )

      // When
      await request(app.getHttpServer())
        .delete(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it("renvoie une 400 si l'id du rendez-vous n'est pas un UUID", async () => {
      // When
      await request(app.getHttpServer())
        .delete(`/rendezvous/12`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid('delete', '/rendezvous/123')
  })
  describe('PUT rendezvous/:idRendezVous', () => {
    const jeune = unJeune()
    const rendezvous = unRendezVous({ jeunes: [jeune] })
    const payload: UpdateRendezVousPayload = {
      jeunesIds: ['1'],
      date: '2021-11-11T08:03:30.000Z',
      comment: undefined,
      duration: 30,
      modality: undefined,
      adresse: undefined,
      organisme: undefined,
      presenceConseiller: true
    }
    const expectedCommand: UpdateRendezVousCommand = {
      idsJeunes: ['1'],
      idRendezVous: rendezvous.id,
      commentaire: undefined,
      date: '2021-11-11T08:03:30.000Z',
      duree: 30,
      modalite: undefined,
      adresse: undefined,
      organisme: undefined,
      presenceConseiller: true
    }
    it('met à jour le rendez-vous', async () => {
      // Given
      updateRendezVousCommandHandler.execute.resolves(
        success({ id: rendezvous.id })
      )
      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.OK)

      expect(
        updateRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(expectedCommand, unUtilisateurDecode())
    })
    it("renvoie une 404 quand le rendez-vous n'existe pas", async () => {
      // Given
      updateRendezVousCommandHandler.execute
        .withArgs(expectedCommand)
        .resolves(
          failure(
            new NonTrouveError('Rendez-vous', expectedCommand.idRendezVous)
          )
        )

      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('renvoie une 400 (BAD REQUEST) pour une mauvaise commande', async () => {
      updateRendezVousCommandHandler.execute
        .withArgs(expectedCommand)
        .resolves(failure(new MauvaiseCommandeError('Rendez-vous')))

      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it("renvoie une 400 (BAD REQUEST) quand la date n'est pas au bon format", async () => {
      payload.date = 'aaa'
      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid('put', '/rendezvous/123')
  })
})
