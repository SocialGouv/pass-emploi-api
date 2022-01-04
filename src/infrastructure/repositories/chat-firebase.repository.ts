import { Injectable } from '@nestjs/common'
import { ChatSecretsQueryModel } from 'src/application/queries/query-models/chat.query-models'
import { Authentification } from 'src/domain/authentification'
import { Chat } from '../../domain/chat'
import { FirebaseClient } from '../clients/firebase-client'

@Injectable()
export class ChatFirebaseRepository implements Chat.Repository {
  constructor(private firebaseClient: FirebaseClient) {}

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    await this.firebaseClient.initializeChatIfNotExists(jeuneId, conseillerId)
  }

  async getChatSecretsQueryModel(
    utilisateur: Authentification.Utilisateur
  ): Promise<ChatSecretsQueryModel | undefined> {
    const firebaseToken = await this.firebaseClient.getToken(utilisateur)
    return { token: firebaseToken, cle: '' }
  }
}
