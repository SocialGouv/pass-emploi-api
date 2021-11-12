import { Injectable } from '@nestjs/common'
import { TokenMessage } from 'firebase-admin/messaging'

@Injectable()
export class FakeFirebaseClient {
  private readonly messages: TokenMessage[] = []
  private readonly chats: Array<{ jeuneId: string; conseillerId: string }> = []

  async send(tokenMessage: TokenMessage): Promise<void> {
    this.messages.push(tokenMessage)
  }

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    const chatExitsteDeja = this.chats.some(
      chat => chat.jeuneId === jeuneId && chat.conseillerId === conseillerId
    )

    if (!chatExitsteDeja) {
      this.chats.push({ jeuneId, conseillerId })
    }
  }
}
