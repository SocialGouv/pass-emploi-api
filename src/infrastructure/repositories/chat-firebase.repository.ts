import { Injectable } from '@nestjs/common'
import { Chat } from '../../domain/chat'
import { FirebaseClient } from './firebase-client'

@Injectable()
export class ChatFirebaseRepository implements Chat.Repository {
  constructor(private firebaseClient: FirebaseClient) {}

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    await this.firebaseClient.initializeChatIfNotExists(jeuneId, conseillerId)
  }
}
