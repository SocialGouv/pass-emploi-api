import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { DateService } from 'src/utils/date-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { testConfig } from 'test/utils/module-for-testing'
import { EnvoyerEmailsMessagesConseillersJobHandler } from '../../../src/application/jobs/envoyer-emails-messages-conseillers.job.handler'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Mail } from '../../../src/domain/mail'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('EnvoyerEmailsMessagesConseillersJobHandler', () => {
  let envoyerEmailsMessagesConseillersJobHandler: EnvoyerEmailsMessagesConseillersJobHandler
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let mailClient: StubbedType<Mail.Service>
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    chatRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    mailClient = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)

    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

    envoyerEmailsMessagesConseillersJobHandler =
      new EnvoyerEmailsMessagesConseillersJobHandler(
        chatRepository,
        conseillerRepository,
        mailClient,
        dateService,
        testConfig(),
        suiviJobService
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
      const result = await envoyerEmailsMessagesConseillersJobHandler.handle()

      // Then
      expect(mailClient.envoyerMailConversationsNonLues).to.have.callCount(1)
      expect(
        mailClient.envoyerMailConversationsNonLues
      ).to.have.been.calledWithExactly(conseillers[0], 1)
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({ succes: 2, mailsEnvoyes: 1 })
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
      const result = await envoyerEmailsMessagesConseillersJobHandler.handle()

      // Then
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({ succes: 2, mailsEnvoyes: 1 })
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
      const result = await envoyerEmailsMessagesConseillersJobHandler.handle()
      // Then
      expect(
        conseillerRepository.updateDateVerificationMessages
      ).to.have.callCount(2)
      expect(result.resultat).to.deep.equal({ succes: 2, mailsEnvoyes: 1 })
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
      const result = await envoyerEmailsMessagesConseillersJobHandler.handle()

      // Then
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({ succes: 1, mailsEnvoyes: 1 })
      expect(result.nbErreurs).to.equal(1)
    })
  })

  describe("quand il y'a une erreur lors de la recuperation des conseillers", () => {
    it('retourne une failure', async () => {
      // Given
      conseillerRepository.findConseillersMessagesNonVerifies.rejects()

      // When
      const result = await envoyerEmailsMessagesConseillersJobHandler.handle()

      // Then
      expect(result.succes).to.equal(false)
    })
  })
})
