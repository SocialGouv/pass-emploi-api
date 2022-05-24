import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  SendNotificationNouveauMessageCommand,
  SendNotificationNouveauMessageCommandHandler
} from '../../../src/application/commands/send-notification-nouveau-message.command.handler'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune'
import { Notification } from '../../../src/domain/notification'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import {
  unJeune,
  unJeuneSansPushNotificationToken
} from '../../fixtures/jeune.fixture'
import { createSandbox, expect, stubClass } from '../../utils'

describe('SendNotificationNouveauMessageCommandHandler', () => {
  let sendNotificationNouveauMessageCommandHandler: SendNotificationNouveauMessageCommandHandler
  const sandbox: SinonSandbox = createSandbox()
  const jeune = unJeune()
  const jeuneRepository: StubbedType<Jeune.Repository> = stubInterface(sandbox)
  const notificationRepository: StubbedType<Notification.Service> =
    stubInterface(sandbox)
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)

  before(async () => {
    sendNotificationNouveauMessageCommandHandler =
      new SendNotificationNouveauMessageCommandHandler(
        jeuneRepository,
        notificationRepository,
        conseillerAuthorizer
      )
  })

  describe('handle', () => {
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
          await sendNotificationNouveauMessageCommandHandler.handle(command)
        // Then
        expect(notificationRepository.envoyer).not.to.have.been.calledWith(
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
          await sendNotificationNouveauMessageCommandHandler.handle(command)
        // Then
        expect(notificationRepository.envoyer).not.to.have.been.calledWith(
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
          await sendNotificationNouveauMessageCommandHandler.handle(command)
          // Then
          expect(notificationRepository.envoyer).to.have.been.calledWith(
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
            await sendNotificationNouveauMessageCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(emptySuccess())
          expect(notificationRepository.envoyer).not.to.have.been.calledWith(
            Notification.createNouveauMessage(jeune.pushNotificationToken)
          )
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller à envoyer une notification à un jeune', async () => {
      // Given
      const command: SendNotificationNouveauMessageCommand = {
        idJeune: jeune.id,
        idConseiller: jeune.conseiller.id
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await sendNotificationNouveauMessageCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur,
        command.idJeune
      )
    })
  })
})
