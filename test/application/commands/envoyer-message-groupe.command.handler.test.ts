import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { EnvoyerMessageGroupeCommandHandler } from '../../../src/application/commands/envoyer-message-groupe.command.handler'
import { Chat } from '../../../src/domain/chat'
import { createSandbox, expect } from '../../utils'
import { failure } from '../../../src/building-blocks/types/result'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import TypeMessage = Chat.TypeMessage

describe('EnvoyerMessageGroupeCommandHandler', () => {
  let envoyerMessageGroupeCommandHandler: EnvoyerMessageGroupeCommandHandler
  let chatRepository: StubbedType<Chat.Repository>

  beforeEach(() => {
    chatRepository = stubInterface(createSandbox())
    envoyerMessageGroupeCommandHandler = new EnvoyerMessageGroupeCommandHandler(
      chatRepository
    )
  })

  describe('handle', () => {
    describe('quand le message est valide', () => {
      it('envoie un message à chaque jeune', async () => {
        // Given
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
          iv: '123456',
          idConseiller: '41',
          typeMessage: TypeMessage.MESSAGE
        })

        // Then
        expect(chatRepository.envoyerMessageBeneficiaire).to.have.callCount(2)
        expect(
          chatRepository.envoyerMessageBeneficiaire
        ).to.have.been.calledWith('chat-1', {
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          type: TypeMessage.MESSAGE,
          infoPieceJointe: undefined
        })
        expect(
          chatRepository.envoyerMessageBeneficiaire
        ).to.have.been.calledWith('chat-2', {
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          type: TypeMessage.MESSAGE,
          infoPieceJointe: undefined
        })
      })
    })
    describe('quand le message est invalide', () => {
      it('envoie une erreur', async () => {
        // When
        const result = await envoyerMessageGroupeCommandHandler.handle({
          idsBeneficiaires: ['jeune-1', 'jeune-2'],
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          typeMessage: TypeMessage.MESSAGE_PJ
        })

        // Then
        expect(result).to.be.deep.equal(
          failure(
            new MauvaiseCommandeError('Un message PJ doit avoir des info de PJ')
          )
        )
      })
    })
  })
})
