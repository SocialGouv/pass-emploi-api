import { Jeune } from './jeune/jeune'

export const ChatRepositoryToken = 'ChatRepositoryToken'

export interface Chat {
  id: string
  idBeneficiaire: string
}

export interface ChatGroupe {
  id: string
}

export interface ChatMessage {
  message: string
  iv: string
  idConseiller: string
  type: Chat.TypeMessage
  infoPieceJointe?: {
    id: string
    nom: string
  }
}

export interface GroupeMessage extends ChatMessage {
  idsBeneficiaires: string[]
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

  export interface MessageGroupeACreer extends MessageACreer {
    idsBeneficiaires: string[]
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

    recupererGroupe(idListeDeDiffusion: string): Promise<ChatGroupe | undefined>

    envoyerMessageBeneficiaire(
      idChat: string,
      message: ChatMessage
    ): Promise<void>

    envoyerMessageGroupe(
      idGroupe: string,
      message: GroupeMessage
    ): Promise<void>

    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>

    supprimerChat(idJeune: string): Promise<void>

    supprimerListeDeDiffusion(idListe: string): Promise<void>

    envoyerMessageTransfert(jeune: Jeune): Promise<void>
  }

  export function creerMessage(aCreer: MessageACreer): ChatMessage {
    return {
      message: aCreer.message,
      iv: aCreer.iv,
      idConseiller: aCreer.idConseiller,
      type: aCreer.infoPieceJointe
        ? Chat.TypeMessage.MESSAGE_PJ
        : Chat.TypeMessage.MESSAGE,
      infoPieceJointe: aCreer.infoPieceJointe
    }
  }

  export function creerMessageGroupe(
    aCreer: MessageGroupeACreer
  ): GroupeMessage {
    return {
      message: aCreer.message,
      iv: aCreer.iv,
      idConseiller: aCreer.idConseiller,
      type: aCreer.infoPieceJointe
        ? Chat.TypeMessage.MESSAGE_PJ
        : Chat.TypeMessage.MESSAGE,
      infoPieceJointe: aCreer.infoPieceJointe,
      idsBeneficiaires: aCreer.idsBeneficiaires
    }
  }
}
