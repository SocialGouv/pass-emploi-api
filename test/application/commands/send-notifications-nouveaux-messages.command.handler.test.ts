import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { stubClassSandbox } from 'test/utils/types'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../../src/application/commands/send-notifications-nouveaux-messages.command.handler'
import { Notification } from '../../../src/domain/notification/notification'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('SendNotificationsNouveauxMessagesCommandHandler', () => {
  let sendNotificationsNouveauxMessagesCommandHandler: SendNotificationsNouveauxMessagesCommandHandler

  const jeune1 = unJeune({ id: '1' })
  const jeune2 = unJeune({ id: '2' })
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  beforeEach(async () => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    notificationService.notifierLesJeunesDuNouveauMessage.resolves()

    sendNotificationsNouveauxMessagesCommandHandler =
      new SendNotificationsNouveauxMessagesCommandHandler(
        jeuneRepository,
        notificationService,
        conseillerAuthorizer
      )
  })

  describe('handle', () => {
    describe("quand tous les jeunes se sont connectés au moins une fois à l'application", () => {
      it('envoie une notification de type nouveau message aux jeunes', async () => {
        // Given
        const command: SendNotificationsNouveauxMessagesCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: jeune1.conseiller.id
        }
        const jeunes = [jeune1, jeune2]
        jeuneRepository.findAllJeunesByConseiller
          .withArgs(command.idsJeunes, command.idConseiller)
          .resolves(jeunes)

        // When
        await sendNotificationsNouveauxMessagesCommandHandler.handle(command)
        // Then
        expect(
          notificationService.notifierLesJeunesDuNouveauMessage
        ).to.have.been.calledWithExactly(jeunes)
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
