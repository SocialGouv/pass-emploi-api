import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { stubClassSandbox } from 'test/utils/types'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  SendNotificationsNouveauxMessagesExterneCommand,
  SendNotificationsNouveauxMessagesExterneCommandHandler
} from '../../../src/application/commands/send-notifications-nouveaux-messages-externe.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Notification } from '../../../src/domain/notification/notification'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('SendNotificationsNouveauxMessagesExterneCommandHandler', () => {
  let sendNotificationsNouveauxMessagesCommandHandler: SendNotificationsNouveauxMessagesExterneCommandHandler

  const jeune1 = { ...unJeune({ id: '1' }), idAuthentification: 'id-auth-1' }
  const jeune2 = { ...unJeune({ id: '2' }), idAuthentification: 'id-auth-2' }
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
      new SendNotificationsNouveauxMessagesExterneCommandHandler(
        jeuneRepository,
        notificationService,
        conseillerAuthorizer
      )
  })

  describe('handle', () => {
    describe("quand tous les jeunes se sont connectés au moins une fois à l'application", () => {
      it('envoie une notification de type nouveau message aux jeunes', async () => {
        // Given
        const command: SendNotificationsNouveauxMessagesExterneCommand = {
          idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2'],
          idAuthentificationConseiller: 'id-authentification-conseiller'
        }

        const jeunes = [jeune1, jeune2]
        jeuneRepository.findAllJeunesByAuthentificationAndConseiller
          .withArgs(
            command.idsAuthentificationJeunes,
            command.idAuthentificationConseiller
          )
          .resolves(jeunes)

        // When
        await sendNotificationsNouveauxMessagesCommandHandler.handle(command)

        // Then
        expect(
          notificationService.notifierLesJeunesDuNouveauMessage
        ).to.have.been.calledWithExactly(jeunes)
      })
    })

    describe('quand certains jeunes n’existent pas', () => {
      it('renvoie une NonTrouveError', async () => {
        // Given
        const command: SendNotificationsNouveauxMessagesExterneCommand = {
          idsAuthentificationJeunes: [
            'id-auth-1',
            'id-auth-2',
            'id-auth-inexistant'
          ],
          idAuthentificationConseiller: 'id-authentification-conseiller'
        }

        jeuneRepository.findAllJeunesByAuthentificationAndConseiller
          .withArgs(
            command.idsAuthentificationJeunes,
            command.idAuthentificationConseiller
          )
          .resolves([jeune1])

        // When
        const actual =
          await sendNotificationsNouveauxMessagesCommandHandler.handle(command)

        // Then
        expect(actual).to.deep.equal(
          failure(
            new NonTrouveError(
              'Jeune',
              'idAuthentification id-auth-2, id-auth-inexistant'
            )
          )
        )
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller à envoyer des notifications à plusieurs jeunes', async () => {
      // Given
      const command: SendNotificationsNouveauxMessagesExterneCommand = {
        idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2'],
        idAuthentificationConseiller: 'id-authentification-conseiller'
      }

      // When
      await sendNotificationsNouveauxMessagesCommandHandler.authorize(command)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseillerExterne
      ).to.have.been.calledWithExactly(command.idAuthentificationConseiller)
    })
  })
})
