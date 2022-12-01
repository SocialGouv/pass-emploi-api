import { Injectable } from '@nestjs/common'
import { Chat } from '../../domain/chat'
import { FirebaseClient } from '../clients/firebase-client'
import { Jeune } from '../../domain/jeune/jeune'

@Injectable()
export class ChatFirebaseRepository implements Chat.Repository {
  constructor(private firebaseClient: FirebaseClient) {}

  async initializeChatIfNotExists(
    jeuneId: string,
    conseillerId: string
  ): Promise<void> {
    await this.firebaseClient.initializeChatIfNotExists(jeuneId, conseillerId)
  }

  async initializeListeDeDiffusionIfNotExists(
    _idConseiller: string,
    _idListeDeDiffusion: string
  ): Promise<void> {
    return
  }

  async getNombreDeConversationsNonLues(conseillerId: string): Promise<number> {
    return this.firebaseClient.getNombreDeConversationsNonLues(conseillerId)
  }

  supprimerChat(idJeune: string): Promise<void> {
    return this.firebaseClient.supprimerChat(idJeune)
  }

  envoyerMessageTransfert(jeune: Jeune): Promise<void> {
    return this.firebaseClient.envoyerMessageTransfertJeune(jeune)
  }
}
