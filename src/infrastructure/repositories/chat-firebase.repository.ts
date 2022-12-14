import { Injectable } from '@nestjs/common'
import { Chat, ChatMessage } from '../../domain/chat'
import { Jeune } from '../../domain/jeune/jeune'
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

  async initializeListeDeDiffusionIfNotExists(
    idConseiller: string,
    idListeDeDiffusion: string
  ): Promise<void> {
    await this.firebaseClient.initializeGroupIfNotExists(
      idConseiller,
      idListeDeDiffusion
    )
  }

  envoyerMessageBeneficiaire(_idChat: string, _message: ChatMessage): Promise<void> {
    throw new Error('Not implemented')
  }

  recupererChat(_idJeune: string): Promise<Chat> {
    throw new Error('Not implemented')
  }

  async getNombreDeConversationsNonLues(conseillerId: string): Promise<number> {
    return this.firebaseClient.getNombreDeConversationsNonLues(conseillerId)
  }

  supprimerChat(idJeune: string): Promise<void> {
    return this.firebaseClient.supprimerChat(idJeune)
  }

  supprimerListeDeDiffusion(idListe: string): Promise<void> {
    return this.firebaseClient.supprimerGroup(idListe)
  }

  envoyerMessageTransfert(jeune: Jeune): Promise<void> {
    return this.firebaseClient.envoyerMessageTransfertJeune(jeune)
  }
}
