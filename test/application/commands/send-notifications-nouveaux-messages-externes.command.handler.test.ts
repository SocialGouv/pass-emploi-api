import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { stubClassSandbox } from 'test/utils/types'
import {
  SendNotificationsNouveauxMessagesExternesCommand,
  SendNotificationsNouveauxMessagesExternesCommandHandler
} from '../../../src/application/commands/send-notifications-nouveaux-messages-externes.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Notification } from '../../../src/domain/notification/notification'
import { unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect } from '../../utils'

describe('SendNotificationsNouveauxMessagesExternesCommandHandler', () => {
  let sendNotificationsNouveauxMessagesCommandHandler: SendNotificationsNouveauxMessagesExternesCommandHandler

  const jeune1 = { ...unJeune({ id: '1' }), idAuthentification: 'id-auth-1' }
  const jeune2 = { ...unJeune({ id: '2' }), idAuthentification: 'id-auth-2' }
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationService: StubbedClass<Notification.Service>

  beforeEach(async () => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierLesJeunesDuNouveauMessage.resolves()

    sendNotificationsNouveauxMessagesCommandHandler =
      new SendNotificationsNouveauxMessagesExternesCommandHandler(
        jeuneRepository,
        notificationService
      )
  })

  describe('handle', () => {
    describe("quand tous les jeunes se sont connectés au moins une fois à l'application", () => {
      it('envoie une notification de type nouveau message aux jeunes', async () => {
        // Given
        const command: SendNotificationsNouveauxMessagesExternesCommand = {
          idsAuthentificationJeunes: ['id-auth-1', 'id-auth-2']
        }

        const jeunes = [jeune1, jeune2]
        jeuneRepository.findAllJeunesByIdsAuthentification
          .withArgs(command.idsAuthentificationJeunes)
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
        const command: SendNotificationsNouveauxMessagesExternesCommand = {
          idsAuthentificationJeunes: [
            'id-auth-1',
            'id-auth-2',
            'id-auth-inexistant'
          ]
        }

        jeuneRepository.findAllJeunesByIdsAuthentification
          .withArgs(command.idsAuthentificationJeunes)
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
})
