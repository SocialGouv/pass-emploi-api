import { Jeune } from './jeune/jeune'
import { Result, success } from '../building-blocks/types/result'

export const ChatRepositoryToken = 'ChatRepositoryToken'

export interface Chat {
  id: string
}

export type ChatMessage = {
  message: string
  iv: string
  idConseiller: string
  type: Chat.TypeMessage
  infoPieceJointe?: {
    id: string
    nom: string
  }
}

export namespace Chat {
  export enum TypeMessage {
    MESSAGE = 'MESSAGE',
    MESSAGE_PJ = 'MESSAGE_PJ'
  }

  export interface MessageACreer {
    message: string
    iv: string
    idConseiller: string
    infoPieceJointe?: {
      id: string
      nom: string
    }
  }

  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>

    initializeListeDeDiffusionIfNotExists(
      idConseiller: string,
      idListeDeDiffusion: string
    ): Promise<void>

    recupererChat(idBeneficiaire: string): Promise<Chat | undefined>

    envoyerMessageBeneficiaire(
      idChat: string,
      message: ChatMessage
    ): Promise<void>

    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>

    supprimerChat(idJeune: string): Promise<void>

    supprimerListeDeDiffusion(idListe: string): Promise<void>

    envoyerMessageTransfert(jeune: Jeune): Promise<void>
  }

  export function creerMessage(aCreer: MessageACreer): Result<ChatMessage> {
    return success({
      message: aCreer.message,
      iv: aCreer.iv,
      idConseiller: aCreer.idConseiller,
      type: aCreer.infoPieceJointe
        ? Chat.TypeMessage.MESSAGE_PJ
        : Chat.TypeMessage.MESSAGE,
      infoPieceJointe: aCreer.infoPieceJointe
    })
  }
}
