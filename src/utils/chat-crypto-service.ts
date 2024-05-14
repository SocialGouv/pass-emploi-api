import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import * as CryptoJS from 'crypto-js'

export interface EncryptedTextWithInitializationVector {
  encryptedText: string
  iv: string
}

@Injectable()
export class ChatCryptoService {
  key: CryptoJS.lib.WordArray
  constructor(private configService: ConfigService) {
    this.key = CryptoJS.enc.Utf8.parse(
      this.configService.get('firebase.encryptionKey') ?? ''
    )
  }

  encrypt(message: string): EncryptedTextWithInitializationVector {
    const iv = CryptoJS.lib.WordArray.random(16)
    const encrypted = CryptoJS.AES.encrypt(message, this.key, { iv })

    return {
      encryptedText: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: encrypted.iv.toString(CryptoJS.enc.Base64)
    }
  }

  decrypt(iv64: string, content: string): string {
    const iv = CryptoJS.enc.Base64.parse(iv64)
    return CryptoJS.AES.decrypt(content, this.key, { iv }).toString(
      CryptoJS.enc.Utf8
    )
  }
}
