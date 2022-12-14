import { Jeune } from './jeune/jeune'
import { failure, Result, success } from '../building-blocks/types/result'
import { MauvaiseCommandeError } from '../building-blocks/types/domain-error'

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
    typeMessage: Chat.TypeMessage
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
    if (aCreer.typeMessage === TypeMessage.MESSAGE && aCreer.infoPieceJointe) {
      return failure(
        new MauvaiseCommandeError(
          "Un message simple ne peut pas avoir d'info de PJ"
        )
      )
    }

    if (
      aCreer.typeMessage === TypeMessage.MESSAGE_PJ &&
      !aCreer.infoPieceJointe
    ) {
      return failure(
        new MauvaiseCommandeError('Un message PJ doit avoir des info de PJ')
      )
    }

    return success({
      message: aCreer.message,
      iv: aCreer.iv,
      idConseiller: aCreer.idConseiller,
      type: aCreer.typeMessage,
      infoPieceJointe: aCreer.infoPieceJointe
    })
  }
}
