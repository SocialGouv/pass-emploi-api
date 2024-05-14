import { ChatCryptoService } from 'src/utils/chat-crypto-service'
import { expect } from 'chai'
import { ConfigService } from '@nestjs/config'

describe('ChatCryptoService', () => {
  describe('encrypt / decrypt', () => {
    it('chiffre et déchiffre un message', () => {
      const configService = new ConfigService()
      const chatCryptoService = new ChatCryptoService(configService)

      const message = 'bonjour'
      const messageChiffre = chatCryptoService.encrypt(message)

      expect(messageChiffre.encryptedText).not.equal(message)

      const messageDechiffre = chatCryptoService.decrypt(
        messageChiffre.iv,
        messageChiffre.encryptedText
      )
      expect(messageDechiffre).to.equal(message)
    })
  })
})
