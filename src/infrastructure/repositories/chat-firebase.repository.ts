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
  ): Promise<ChatSecretsQueryModel | undefined> {
    const firebaseToken = await this.firebaseClient.getToken(utilisateur)
    const encryptionKey = this.configService.get('firebase').encryptionKey

    return firebaseToken && encryptionKey
      ? {
          token: firebaseToken,
          cle: encryptionKey
        }
      : undefined
  }

  async getNombreDeConversationsNonLues(conseillerId: string): Promise<number> {
    return this.firebaseClient.getNombreDeConversationsNonLues(conseillerId)
  }

  async transfererChat(
    conseillerCibleId: string,
    jeuneIds: string[]
  ): Promise<void> {
    return this.firebaseClient.transfererChat(conseillerCibleId, jeuneIds)
  }

  supprimerChat(idJeune: string): Promise<void> {
    return this.firebaseClient.supprimerChat(idJeune)
  }
}
