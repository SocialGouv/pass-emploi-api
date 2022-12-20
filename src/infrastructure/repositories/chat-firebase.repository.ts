import { Injectable } from '@nestjs/common'
import { Chat, ChatGroupe, ChatMessage, GroupeMessage } from '../../domain/chat'
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

  async recupererChat(idJeune: string): Promise<Chat | undefined> {
    return this.firebaseClient.recupererChat(idJeune)
  }

  async recupererGroupe(
    idListeDeDiffusion: string
  ): Promise<ChatGroupe | undefined> {
    return this.firebaseClient.recupererGroupe(idListeDeDiffusion)
  }

  async envoyerMessageBeneficiaire(
    idChat: string,
    message: ChatMessage
  ): Promise<void> {
    await this.firebaseClient.envoyerMessage(idChat, message)
  }

  async envoyerMessageGroupe(
    idChat: string,
    message: GroupeMessage
  ): Promise<void> {
    await this.firebaseClient.envoyerMessageGroupe(idChat, message)
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
