import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
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
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../../src/application/commands/send-notifications-nouveaux-messages.command.handler'

describe('SendNotificationsNouveauxMessagesCommandHandler', () => {
  let sendNotificationsNouveauxMessagesCommandHandler: SendNotificationsNouveauxMessagesCommandHandler
  const sandbox: SinonSandbox = createSandbox()
  const jeune = unJeune()
  const jeuneRepository: StubbedType<Jeune.Repository> = stubInterface(sandbox)
  const notificationRepository: StubbedType<Notification.Repository> =
    stubInterface(sandbox)
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)

  before(async () => {
    sendNotificationsNouveauxMessagesCommandHandler =
      new SendNotificationsNouveauxMessagesCommandHandler(
        jeuneRepository,
        notificationRepository,
        conseillerAuthorizer
      )
  })

  describe('handle', () => {
    describe('quand un des jeunes n"existe pas', () => {
      it('renvoie une failure sans envoyer de notifications à aucun jeune', async () => {
        // Given
        const jeune2 = unJeune({ id: '2' })

        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)
        jeuneRepository.get.withArgs(jeune2.id).resolves(jeune2)

        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeune.id, jeune2.id],
          idConseiller: '1'
        }

        // When
        const result =
          await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauMessage(jeune.pushNotificationToken)
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauMessage(jeune2.pushNotificationToken)
        )
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', jeune.id))
        )
      })
    })
    describe('quand un jeune n"est pas lié au conseiller', () => {
      it('renvoie une failure sans envoyer de notifications', async () => {
        // Given
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeune.id],
          idConseiller: 'FAKE_CONSEILLER'
        }

        // When
        const result =
          await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauMessage(jeune.pushNotificationToken)
        )
        expect(result).to.deep.equal(
          failure(
            new JeuneNonLieAuConseillerError(command.idConseiller, jeune.id)
          )
        )
      })
    })
    describe('quand les jeunes existent et sont liés au bon conseiller', () => {
      describe('quand tous les jeunes se sont connectés au moins une fois sur l"application', () => {
        it('envoie une notification de type nouveau message aux jeunes', async () => {
          // Given
          const jeune2 = unJeune({ id: '2' })

          jeuneRepository.get.withArgs(jeune2.id).resolves(jeune2)

          const command: SendNotificationsNouveauxMessagesCommand = {
            idsJeunes: [jeune.id, jeune2.id],
            idConseiller: '1'
          }
          // When
          await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
          // Then
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createNouveauMessage(jeune.pushNotificationToken)
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createNouveauMessage(jeune2.pushNotificationToken)
          )
        })
      })
      describe('quand un des jeunes ne s"est jamais connecté sur l"application', () => {
        it('renvoie un success sans envoyer de notifications', async () => {
          // Given
          const jeune = unJeuneSansPushNotificationToken()
          const jeune2 = unJeune({ id: '2' })

          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
          jeuneRepository.get.withArgs(jeune2.id).resolves(jeune2)

          const command: SendNotificationsNouveauxMessagesCommand = {
            idsJeunes: [jeune.id, jeune2.id],
            idConseiller: '1'
          }
          // When
          const result =
            await sendNotificationsNouveauxMessagesCommandHandler.handle(
              command
            )
          // Then
          expect(result).to.deep.equal(emptySuccess())
          expect(notificationRepository.send).not.to.have.been.calledWith(
            Notification.createNouveauMessage(jeune.pushNotificationToken)
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createNouveauMessage(jeune2.pushNotificationToken)
          )
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller à envoyer une notification plusieurs jeunes', async () => {
      // Given
      const command: SendNotificationsNouveauxMessagesCommand = {
        idsJeunes: ['ABCDE', 'GHEIJ'],
        idConseiller: jeune.conseiller.id
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await sendNotificationsNouveauxMessagesCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur,
        'ABCDE'
      )
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur,
        'GHEIJ'
      )
    })
  })
})
