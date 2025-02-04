import { Injectable } from '@nestjs/common'
import {
  Chat,
  ChatGroupe,
  ChatIndividuel,
  MessageGroupe,
  MessageIndividuel,
  MessageRecherche
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

  async recupererMessagesConversation(
    idBeneficiaire: string
  ): Promise<MessageRecherche[]> {
    return this.firebaseClient.recupereMessagesConversation(idBeneficiaire)
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
    message: MessageIndividuel,
    options: { sentByBeneficiaire: boolean } = { sentByBeneficiaire: false }
  ): Promise<void> {
    await this.firebaseClient.envoyerMessageIndividuel(idChat, message, options)
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

  envoyerStatutAnalysePJ(
    idJeune: string,
    idMessage: string,
    statut: Chat.StatutPJ
  ): Promise<void> {
    const statutFirebase = mapStatutAnalyse(statut)
    return this.firebaseClient.envoyerStatutAnalysePJ(
      idJeune,
      idMessage,
      statutFirebase
    )
  }
}

function mapStatutAnalyse(statut: Chat.StatutPJ): string {
  switch (statut) {
    case Chat.StatutPJ.ANALYSE_EN_COURS:
      return 'analyse_en_cours'
    case Chat.StatutPJ.ERREUR_ANALYSE:
      return 'erreur_analyse'
    case Chat.StatutPJ.FICHIER_SAIN:
      return 'valide'
    case Chat.StatutPJ.FICHIER_MALVEILLANT:
      return 'non_valide'
    case Chat.StatutPJ.FICHIER_EXPIRE:
      return 'expiree'
  }
}
