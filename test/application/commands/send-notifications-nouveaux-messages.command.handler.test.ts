import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../../src/application/commands/send-notifications-nouveaux-messages.command.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune'
import { Notification } from '../../../src/domain/notification'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import {
  unJeune,
  unJeuneSansPushNotificationToken
} from '../../fixtures/jeune.fixture'
import { createSandbox, expect, stubClass } from '../../utils'

describe('SendNotificationsNouveauxMessagesCommandHandler', () => {
  let sendNotificationsNouveauxMessagesCommandHandler: SendNotificationsNouveauxMessagesCommandHandler
  const sandbox: SinonSandbox = createSandbox()
  const jeune1 = unJeune({ id: '1' })
  const jeune2 = unJeune({ id: '2' })
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
    describe("quand des jeunes n'existent pas", () => {
      it("n'envoie pas de notification", async () => {
        // Given
        const jeunePasBon = unJeune({
          id: 'jeune-non-trouve',
          pushNotificationToken: 'jeune-non-trouve'
        })
        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeune1.id, jeunePasBon.id],
          idConseiller: jeune1.conseiller.id
        }
        jeuneRepository.getJeunes
          .withArgs(command.idsJeunes)
          .resolves([jeune1, undefined])

        // When
        await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(notificationRepository.send).to.have.been.calledWithExactly(
          Notification.createNouveauMessage(jeune1.pushNotificationToken)
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauMessage(jeunePasBon.pushNotificationToken)
        )
      })
    })
    describe('quand des jeunes ne sont pas liés au conseiller', () => {
      it("n'envoie pas de notification", async () => {
        // Given
        const jeunePasBon = unJeune({
          id: 'jeune-pas-du-conseiller',
          pushNotificationToken: 'jeune-pas-du-conseiller'
        })
        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeunePasBon.id],
          idConseiller: 'x'
        }
        jeuneRepository.getJeunes
          .withArgs(command.idsJeunes)
          .resolves([jeunePasBon])

        // When
        await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createNouveauMessage(jeunePasBon.pushNotificationToken)
        )
      })
    })
    describe("quand tous les jeunes se sont connectés au moins une fois à l'application", () => {
      it('envoie une notification de type nouveau message aux jeunes', async () => {
        // Given
        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: jeune1.conseiller.id
        }
        jeuneRepository.getJeunes
          .withArgs(command.idsJeunes)
          .resolves([jeune1, jeune2])

        // When
        await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(notificationRepository.send).to.have.been.calledWithExactly(
          Notification.createNouveauMessage(jeune1.pushNotificationToken)
        )
        expect(notificationRepository.send).to.have.been.calledWithExactly(
          Notification.createNouveauMessage(jeune2.pushNotificationToken)
        )
      })
    })
    describe('quand un des jeunes ne s\'est jamais connecté sur l"application', () => {
      it('envoie une notification uniquement aux jeunes qui se sont déjà connectés', async () => {
        // Given
        const jeune = unJeuneSansPushNotificationToken()

        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeune.id, jeune2.id],
          idConseiller: jeune1.conseiller.id
        }

        jeuneRepository.getJeunes
          .withArgs(command.idsJeunes)
          .resolves([jeune, jeune2])

        // When
        const result =
          await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(notificationRepository.send).not.to.have.been.calledWithExactly(
          Notification.createNouveauMessage(jeune.pushNotificationToken)
        )
        expect(notificationRepository.send).to.have.been.calledWithExactly(
          Notification.createNouveauMessage(jeune2.pushNotificationToken)
        )
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller à envoyer des notifications à plusieurs jeunes', async () => {
      // Given
      const command: SendNotificationsNouveauxMessagesCommand = {
        idsJeunes: ['ABCDE', 'GHEIJ'],
        idConseiller: jeune1.conseiller.id
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
        utilisateur
      )
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur
      )
    })
  })
})
