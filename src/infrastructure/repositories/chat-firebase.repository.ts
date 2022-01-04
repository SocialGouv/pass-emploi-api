import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatSecretsQueryModel } from 'src/application/queries/query-models/authentification.query-models'
import { Authentification } from 'src/domain/authentification'
import { Chat } from '../../domain/chat'
import { FirebaseClient } from '../clients/firebase-client'

@Injectable()
export class ChatFirebaseRepository implements Chat.Repository {
  constructor(
    private firebaseClient: FirebaseClient,
    private configService: ConfigService
  ) {}

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    await this.firebaseClient.initializeChatIfNotExists(jeuneId, conseillerId)
  }

  async getChatSecretsQueryModel(
    utilisateur: Authentification.Utilisateur
  ): Promise<ChatSecretsQueryModel> {
    const firebaseToken = await this.firebaseClient.getToken(utilisateur)
    return {
      token: firebaseToken,
      cle: this.configService.get('firebase').encryptionKey
    }
  }
}
