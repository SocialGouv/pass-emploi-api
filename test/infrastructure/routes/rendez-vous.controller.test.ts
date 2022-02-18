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
  failure
} from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'

describe('RendezvousController', () => {
  let deleteRendezVousCommandHandler: StubbedClass<DeleteRendezVousCommandHandler>
  let app: INestApplication

  before(async () => {
    deleteRendezVousCommandHandler = stubClass(DeleteRendezVousCommandHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(DeleteRendezVousCommandHandler)
      .useValue(deleteRendezVousCommandHandler)
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
    const rendezvous = unRendezVous(jeune)
    const command: DeleteRendezVousCommand = {
      idRendezVous: rendezvous.id
    }
    it('supprime le rendez-vous', async () => {
      //Given
      deleteRendezVousCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())
      //When
      await request(app.getHttpServer())
        .delete(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)
      expect(
        deleteRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
    })
    it('renvoie une 404(NOT FOUND) si le rendez-vous n"existe pas', async () => {
      //Given
      deleteRendezVousCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(new NonTrouveError('Rendez-vous', command.idRendezVous))
        )

      const expectedMessageJson = {
        code: 'NON_TROUVE',
        message: `Rendez-vous ${command.idRendezVous} non trouvé(e)`
      }
      //When
      await request(app.getHttpServer())
        .delete(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedMessageJson)
    })
    it('renvoie une 400(BAD REQUEST) si l"id du rendez-vous n"est pas un UUID', async () => {
      const expectedMessageJson = {
        statusCode: 400,
        message: 'Validation failed (uuid  is expected)',
        error: 'Bad Request'
      }
      //When
      await request(app.getHttpServer())
        .delete(`/rendezvous/12`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.BAD_REQUEST)
        .expect(expectedMessageJson)
    })
    ensureUserAuthenticationFailsIfInvalid('delete', '/rendezvous/123')
  })
})
