import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { stubClassSandbox } from 'test/utils/types'
import {
  SendNotificationsNouveauxMessagesExternesCommand,
  SendNotificationsNouveauxMessagesExternesCommandHandler
} from '../../../src/application/commands/send-notifications-nouveaux-messages-externes.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Notification } from '../../../src/domain/notification/notification'
import { RateLimiterService } from '../../../src/utils/rate-limiter.service'
import { unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import { Core } from '../../../src/domain/core'

describe('SendNotificationsNouveauxMessagesExternesCommandHandler', () => {
  let sendNotificationsNouveauxMessagesCommandHandler: SendNotificationsNouveauxMessagesExternesCommandHandler

  const jeune1 = { ...unJeune({ id: '1' }), idAuthentification: 'id-auth-1' }
  const jeune2 = { ...unJeune({ id: '2' }), idAuthentification: 'id-auth-2' }
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationService: StubbedClass<Notification.Service>
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  beforeEach(async () => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierLesJeunesDuNouveauMessage.resolves()

    sendNotificationsNouveauxMessagesCommandHandler =
      new SendNotificationsNouveauxMessagesExternesCommandHandler(
        jeuneRepository,
        notificationService,
        rateLimiterService
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
        jeuneRepository.findAllJeunesByIdsAuthentificationAndStructures
          .withArgs(
            command.idsAuthentificationJeunes,
            Core.structuresPoleEmploi
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
        const command: SendNotificationsNouveauxMessagesExternesCommand = {
          idsAuthentificationJeunes: [
            'id-auth-1',
            'id-auth-2',
            'id-auth-inexistant'
          ]
        }

        jeuneRepository.findAllJeunesByIdsAuthentificationAndStructures
          .withArgs(
            command.idsAuthentificationJeunes,
            Core.structuresPoleEmploi
          )
          .resolves([jeune1])

        // When
        const actual =
          await sendNotificationsNouveauxMessagesCommandHandler.handle(command)

        // Then
        expect(
          notificationService.notifierLesJeunesDuNouveauMessage
        ).to.have.been.calledWithExactly([jeune1])
        expect(actual).to.deep.equal(
          success({
            idsNonTrouves: ['id-auth-2', 'id-auth-inexistant']
          })
        )
      })
    })

    describe('quand tous les jeunes n’existent pas', () => {
      it('renvoie une NonTrouveError', async () => {
        // Given
        const command: SendNotificationsNouveauxMessagesExternesCommand = {
          idsAuthentificationJeunes: ['id-auth-2', 'id-auth-inexistant']
        }

        jeuneRepository.findAllJeunesByIdsAuthentificationAndStructures
          .withArgs(
            command.idsAuthentificationJeunes,
            Core.structuresPoleEmploi
          )
          .resolves([])

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
