import { Jeune } from '../../../src/domain/jeune'
import { createSandbox, expect } from '../../utils'
import { Notification } from '../../../src/domain/notification'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  unJeune,
  unJeuneSansPushNotificationToken
} from '../../fixtures/jeune.fixture'
import {
  SendNotificationNouveauMessageCommand,
  SendNotificationNouveauMessageCommandHandler
} from '../../../src/application/commands/send-notification-nouveau-message.command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'

describe('LoginJeuneCommandHandler', () => {
  describe('execute', () => {
    let sendNotificationNouveauMessageCommandHandler: SendNotificationNouveauMessageCommandHandler
    const sandbox: SinonSandbox = createSandbox()
    const jeune = unJeune()
    const jeuneRepository: StubbedType<Jeune.Repository> =
      stubInterface(sandbox)
    const notificationRepository: StubbedType<Notification.Repository> =
      stubInterface(sandbox)
    before(async () => {
      sendNotificationNouveauMessageCommandHandler =
        new SendNotificationNouveauMessageCommandHandler(
          jeuneRepository,
          notificationRepository
        )
    })
    describe('execute', () => {
      describe('quand le jeune n"existe pas', () => {
        it('renvoie une failure', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune.id).resolves(undefined)
          const command: SendNotificationNouveauMessageCommand = {
            idJeune: jeune.id,
            idConseiller: jeune.conseiller.id
          }

          // When
          const result =
            await sendNotificationNouveauMessageCommandHandler.execute(command)
          // Then
          expect(notificationRepository.send).not.to.have.been.calledWith(
            Notification.createNouveauMessage(jeune.pushNotificationToken)
          )
          expect(result).to.deep.equal(
            failure(new NonTrouveError('Jeune', command.idJeune))
          )
        })
      })
      describe('quand le jeune n"est pas lié au conseiller', () => {
        it('renvoie une failure', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
          const command: SendNotificationNouveauMessageCommand = {
            idJeune: jeune.id,
            idConseiller: 'FAKE_CONSEILLER'
          }

          // When
          const result =
            await sendNotificationNouveauMessageCommandHandler.execute(command)
          // Then
          expect(notificationRepository.send).not.to.have.been.calledWith(
            Notification.createNouveauMessage(jeune.pushNotificationToken)
          )
          expect(result).to.deep.equal(
            failure(
              new JeuneNonLieAuConseillerError(
                command.idConseiller,
                command.idJeune
              )
            )
          )
        })
      })
      describe('quand le jeune existe et est lié au bon conseiller', () => {
        describe('quand le jeune s"est connecté au moins une fois sur l"application', () => {
          it('envoie une notification de type nouveau message au jeune', async () => {
            // Given
            jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
            const command: SendNotificationNouveauMessageCommand = {
              idJeune: jeune.id,
              idConseiller: jeune.conseiller.id
            }
            // When
            await sendNotificationNouveauMessageCommandHandler.execute(command)
            // Then
            expect(notificationRepository.send).to.have.been.calledWith(
              Notification.createNouveauMessage(jeune.pushNotificationToken)
            )
          })
        })
        describe('quand le jeune ne s"est jamais connecté sur l"application', () => {
          it('renvoie un success sans envoyer de notifications', async () => {
            // Given
            const jeune = unJeuneSansPushNotificationToken()
            jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
            const command: SendNotificationNouveauMessageCommand = {
              idJeune: jeune.id,
              idConseiller: jeune.conseiller.id
            }
            // When
            const result =
              await sendNotificationNouveauMessageCommandHandler.execute(
                command
              )
            // Then
            expect(result).to.deep.equal(emptySuccess())
            expect(notificationRepository.send).not.to.have.been.calledWith(
              Notification.createNouveauMessage(jeune.pushNotificationToken)
            )
          })
        })
      })
    })
  })
})
