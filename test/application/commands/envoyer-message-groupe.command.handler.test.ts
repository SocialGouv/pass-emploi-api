import { stubInterface } from '@salesforce/ts-sinon'
import { EnvoyerMessageGroupeCommandHandler } from '../../../src/application/commands/envoyer-message-groupe.command.handler'
import { Chat } from '../../../src/domain/chat'
import { createSandbox, expect, StubbedClass } from '../../utils'

describe('EnvoyerMessageGroupeCommandHandler', () => {
  describe('handle', () => {
    it('envoie un message à chaques jeunes', async () => {
      // Given
      const sandbox = createSandbox()
      const chatRepository: StubbedClass<Chat.Repository> =
        stubInterface(sandbox)
      chatRepository.recupererChat
        .withArgs('jeune-1')
        .resolves({ id: 'chat-1' })
        .withArgs('jeune-2')
        .resolves({ id: 'chat-2' })
      const envoyerMessageGroupeCommandHandler =
        new EnvoyerMessageGroupeCommandHandler(chatRepository)

      // When
      await envoyerMessageGroupeCommandHandler.handle({
        idsBeneficiaires: ['jeune-1', 'jeune-2'],
        message: 'un message',
        iv: '123456'
      })

      // Then
      expect(chatRepository.envoyerMessageBeneficiaire).to.have.callCount(2)
      expect(chatRepository.envoyerMessageBeneficiaire).to.have.been.calledWith(
        'chat-1',
        {
          message: 'un message',
          iv: '123456'
        }
      )
      expect(chatRepository.envoyerMessageBeneficiaire).to.have.been.calledWith(
        'chat-2',
        {
          message: 'un message',
          iv: '123456'
        }
      )
    })
  })
})
