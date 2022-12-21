import { Injectable } from '@nestjs/common'
import {
  Chat,
  ChatIndividuel,
  ChatGroupe,
  MessageIndividuel,
  MessageGroupe
} from '../../domain/chat'
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

  async recupererConversationIndividuelle(
    idJeune: string
  ): Promise<ChatIndividuel | undefined> {
    return this.firebaseClient.recupererChatIndividuel(idJeune)
  }

  async recupererConversationGroupe(
    idListeDeDiffusion: string
  ): Promise<ChatGroupe | undefined> {
    return this.firebaseClient.recupererChatGroupe(idListeDeDiffusion)
  }

  async envoyerMessageIndividuel(
    idChat: string,
    message: MessageIndividuel
  ): Promise<void> {
    await this.firebaseClient.envoyerMessageIndividuel(idChat, message)
  }

  async envoyerMessageGroupe(
    idChat: string,
    message: MessageGroupe
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
