import AES from 'crypto-js/aes'
import Base64 from 'crypto-js/enc-base64'
import Utf8 from 'crypto-js/enc-utf8'
import WordArray from 'crypto-js/lib-typedarrays'
import { ConfigService } from '@nestjs/config'

export interface EncryptedTextWithInitializationVector {
  encryptedText: string
  iv: string
}

export class ChatCrypto {
  key: CryptoJS.lib.WordArray
  constructor(private configService: ConfigService) {
    this.key = Utf8.parse(this.configService.get('firebaseCryptKey') ?? '')
  }

  encrypt(message: string): EncryptedTextWithInitializationVector {
    const iv = WordArray.random(16)
    const encrypted = AES.encrypt(message, this.key, { iv })

    return {
      encryptedText: encrypted.ciphertext.toString(Base64),
      iv: encrypted.iv.toString(Base64)
    }
  }

  decrypt(encryptedText: EncryptedTextWithInitializationVector): string {
    return AES.decrypt(encryptedText.encryptedText, this.key, {
      iv: Base64.parse(encryptedText.iv)
    }).toString(Utf8)
  }
}
