import { Jeune } from './jeune/jeune'

export const ChatRepositoryToken = 'ChatRepositoryToken'

export interface Chat {
  id: string
}

export type ChatMessage = {
  message: string
  iv: string
}

export namespace Chat {
  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>
    initializeListeDeDiffusionIfNotExists(
      idConseiller: string,
      idListeDeDiffusion: string
    ): Promise<void>
    recupererChat(idBeneficiaire: string): Promise<Chat>
    envoyerMessageBeneficiaire(
      idChat: string,
      message: ChatMessage
    ): Promise<void>
    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>
    supprimerChat(idJeune: string): Promise<void>
    supprimerListeDeDiffusion(idListe: string): Promise<void>
    envoyerMessageTransfert(jeune: Jeune): Promise<void>
  }
}
