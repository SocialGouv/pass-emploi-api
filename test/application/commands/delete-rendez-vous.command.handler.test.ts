import { createSandbox, DatabaseForTesting, expect } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { Notification } from '../../../src/domain/notification'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('DeleteRendezVousCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  const jeune = unJeune()
  const rendezVous = unRendezVous(jeune)
  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    deleteRendezVousCommandHandler = new DeleteRendezVousCommandHandler(
      rendezVousRepository,
      notificationRepository
    )
  })
  describe('execute', () => {
    describe('quand le rendez-vous existe', () => {
      describe('quand le jeune s"est déjà connecté au moins une fois sur l"application', () => {
        it('supprime le rendezvous et envoit une notification au jeune', async () => {
          // Given
          rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
          rendezVous.jeune.pushNotificationToken = 'firebaseToken'
          const command: DeleteRendezVousCommand = {
            idRendezVous: rendezVous.id
          }

          // When
          const result = await deleteRendezVousCommandHandler.execute(command)
          // Then
          expect(rendezVousRepository.delete).to.have.been.calledWith(
            rendezVous.id
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createRdvSupprime(
              jeune.pushNotificationToken,
              rendezVous.date
            )
          )
          expect(result).to.deep.equal(emptySuccess())
        })
      })
      describe('quand le jeune ne s"est jamais connecté sur l"application', () => {
        it('supprime le rendez-vous sans envoyer de notification au jeune', async () => {
          // Given
          rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)
          rendezVous.jeune.pushNotificationToken = undefined
          const command: DeleteRendezVousCommand = {
            idRendezVous: rendezVous.id
          }

          // When
          const result = await deleteRendezVousCommandHandler.execute(command)
          // Then
          expect(rendezVousRepository.delete).to.have.been.calledWith(
            rendezVous.id
          )
          expect(notificationRepository.send).not.to.have.been.calledWith(
            Notification.createRdvSupprime(
              jeune.pushNotificationToken,
              rendezVous.date
            )
          )
          expect(result).to.deep.equal(emptySuccess())
        })
      })
    })
    describe('quand le rendez-vous n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(undefined)
        const command: DeleteRendezVousCommand = {
          idRendezVous: rendezVous.id
        }

        // When
        const result = await deleteRendezVousCommandHandler.execute(command)
        // Then
        expect(rendezVousRepository.delete).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createRdvSupprime(
            jeune.pushNotificationToken,
            rendezVous.date
          )
        )
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
        )
      })
    })
  })
})
