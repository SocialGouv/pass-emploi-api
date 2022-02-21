import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DateService } from 'src/utils/date-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { testConfig } from 'test/utils/module-for-testing'
import { HandleJobMailConseillerCommandHandler } from '../../../../src/application/commands/jobs/handle-job-mail-conseiller.command'
import { isSuccess } from '../../../../src/building-blocks/types/result'
import { Chat } from '../../../../src/domain/chat'
import { Conseiller } from '../../../../src/domain/conseiller'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobMailConseillerCommandHandler', () => {
  let handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    chatRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)

    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime)

    handleJobMailConseillerCommandHandler =
      new HandleJobMailConseillerCommandHandler(
        chatRepository,
        conseillerRepository,
        dateService,
        testConfig()
      )
  })

  describe("quand il y'a des conseillers", async () => {
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
    const result = await handleJobMailConseillerCommandHandler.handle({})

    it("envoie des mails aux conseillers dont les messages n'ont pas été vérifés aoujourd'hui", async () => {
      // Then
      expect(conseillerRepository.envoyerUnRappelParMail).to.have.callCount(1)
      expect(
        conseillerRepository.envoyerUnRappelParMail
      ).to.have.been.calledWithExactly(conseillers[0].id, 1)
      expect(result._isSuccess).to.equal(true)
      if (isSuccess(result)) {
        expect(result.data.mailsEnvoyes).to.equal(1)
      }
    })
    it('sauvegarde la nouvelle date de verification des messages pour tous les conseillers', async () => {
      expect(conseillerRepository.save).to.have.callCount(2)
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
      const result = await handleJobMailConseillerCommandHandler.handle({})

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
      const result = await handleJobMailConseillerCommandHandler.handle({})

      // Then
      expect(result._isSuccess).to.equal(false)
    })
  })
})
