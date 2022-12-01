import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DateService } from 'src/utils/date-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { testConfig } from 'test/utils/module-for-testing'
import { HandleJobMailConseillerCommandHandler } from '../../../../src/application/commands/jobs/handle-job-mail-conseiller.command'
import { isSuccess } from '../../../../src/building-blocks/types/result'
import { Chat } from '../../../../src/domain/chat'
import { Conseiller } from '../../../../src/domain/conseiller/conseiller'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { Mail } from '../../../../src/domain/mail'
import { NotificationSupport } from 'src/domain/notification-support'

describe('HandleJobMailConseillerCommandHandler', () => {
  let handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let mailClient: StubbedType<Mail.Service>
  let dateService: StubbedClass<DateService>
  let notificationSupportService: StubbedType<NotificationSupport.Service>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    chatRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    mailClient = stubInterface(sandbox)
    notificationSupportService = stubInterface(sandbox)

    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

    handleJobMailConseillerCommandHandler =
      new HandleJobMailConseillerCommandHandler(
        chatRepository,
        conseillerRepository,
        mailClient,
        dateService,
        testConfig(),
        notificationSupportService
      )
  })

  describe("quand il y'a des conseillers", () => {
    it("envoie des mails aux conseillers qui ont un email et dont les messages n'ont pas été vérifés aoujourd'hui", async () => {
      // Given
      const conseillers = [unConseiller({ id: '1' }), unConseiller({ id: '2' })]
      conseillerRepository.findConseillersMessagesNonVerifies
        .onFirstCall()
        .resolves(conseillers)
        .onSecondCall()
        .resolves([])

      chatRepository.getNombreDeConversationsNonLues
        .withArgs(conseillers[0].id)
        .resolves(1)
        .withArgs(conseillers[1].id)
        .resolves(0)

      // When
      const result = await handleJobMailConseillerCommandHandler.handle()

      // Then
      expect(mailClient.envoyerMailConversationsNonLues).to.have.callCount(1)
      expect(
        mailClient.envoyerMailConversationsNonLues
      ).to.have.been.calledWithExactly(conseillers[0], 1)
      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.mailsEnvoyes).to.equal(1)
      }
    })
    it("envoie pas de mails aux conseillers qui n'ont pas d'email", async () => {
      // Given
      const conseillers = [unConseiller({ id: '1' }), unConseiller({ id: '2' })]
      conseillers[0].email = undefined
      conseillerRepository.findConseillersMessagesNonVerifies
        .onFirstCall()
        .resolves(conseillers)
        .onSecondCall()
        .resolves([])

      chatRepository.getNombreDeConversationsNonLues
        .withArgs(conseillers[0].id)
        .resolves(1)
        .withArgs(conseillers[1].id)
        .resolves(0)

      // When
      const result = await handleJobMailConseillerCommandHandler.handle()

      // Then
      expect(mailClient.envoyerMailConversationsNonLues).to.have.callCount(0)
      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.mailsEnvoyes).to.equal(0)
      }
    })
    it("envoie pas de mails aux conseillers si l'envoi de mail échoue", async () => {
      // Given
      const conseillers = [unConseiller({ id: '1' }), unConseiller({ id: '2' })]
      conseillerRepository.findConseillersMessagesNonVerifies
        .onFirstCall()
        .resolves(conseillers)
        .onSecondCall()
        .resolves([])

      chatRepository.getNombreDeConversationsNonLues
        .withArgs(conseillers[0].id)
        .resolves(1)
        .withArgs(conseillers[1].id)
        .resolves(1)

      mailClient.envoyerMailConversationsNonLues
        .withArgs(conseillers[0], 1)
        .rejects()
        .withArgs(conseillers[1], 1)
        .resolves()

      // When
      const result = await handleJobMailConseillerCommandHandler.handle()

      // Then
      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.mailsEnvoyes).to.equal(1)
      }
    })
    it('sauvegarde la nouvelle date de verification des messages pour tous les conseillers', async () => {
      // Given
      const conseillers = [unConseiller({ id: '1' }), unConseiller({ id: '2' })]
      conseillerRepository.findConseillersMessagesNonVerifies
        .onFirstCall()
        .resolves(conseillers)
        .onSecondCall()
        .resolves([])

      chatRepository.getNombreDeConversationsNonLues
        .withArgs(conseillers[0].id)
        .resolves(1)
        .withArgs(conseillers[1].id)
        .resolves(0)

      // When
      const result = await handleJobMailConseillerCommandHandler.handle()
      // Then
      expect(
        conseillerRepository.updateDateVerificationMessages
      ).to.have.callCount(2)
      if (isSuccess(result)) {
        expect(result.data.succes).to.equal(2)
      }
    })
  })

  describe("quand il y'a une erreur lors de la vérification des messages d'un conseiller", () => {
    it('enregistre un echec et un succes', async () => {
      // Given
      const conseillers = [unConseiller({ id: '1' }), unConseiller({ id: '2' })]
      conseillerRepository.findConseillersMessagesNonVerifies
        .onFirstCall()
        .resolves(conseillers)
        .onSecondCall()
        .resolves([])

      chatRepository.getNombreDeConversationsNonLues
        .withArgs(conseillers[0].id)
        .resolves(1)
        .withArgs(conseillers[1].id)
        .rejects()

      // When
      const result = await handleJobMailConseillerCommandHandler.handle()

      // Then
      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.echecs).to.equal(1)
        expect(result.data.succes).to.equal(1)
        expect(result.data.mailsEnvoyes).to.equal(1)
      }
    })
  })

  describe("quand il y'a une erreur lors de la recuperation des conseillers", () => {
    it('retourne une failure', async () => {
      // Given
      conseillerRepository.findConseillersMessagesNonVerifies.rejects()

      // When
      const result = await handleJobMailConseillerCommandHandler.handle()

      // Then
      expect(result._isSuccess).to.equal(false)
    })
  })
})
