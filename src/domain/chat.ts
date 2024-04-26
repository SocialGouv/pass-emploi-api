import { Jeune } from './jeune/jeune'

export const ChatRepositoryToken = 'ChatRepositoryToken'

export interface ChatIndividuel {
  id: string
  idBeneficiaire: string
}

export interface ChatGroupe {
  id: string
}

export interface MessageIndividuel {
  message: string
  iv: string
  idConseiller: string
  type: Chat.TypeMessage
  infoPieceJointe?: {
    id: string
    nom: string
  }
}

export interface MessageGroupe extends MessageIndividuel {
  idsBeneficiaires: string[]
}

export namespace Chat {
  export type TypeMessage =
    | 'MESSAGE'
    | 'MESSAGE_PJ'
    | 'NOUVEAU_CONSEILLER'
    | 'NOUVEAU_CONSEILLER_TEMPORAIRE'

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

  export type StatutAnalysePJ =
    | 'ANALYSE_EN_COURS'
    | 'ERREUR_ANALYSE'
    | 'FICHIER_SAIN'
    | 'FICHIER_MALVEILLANT'

  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>

    initializeListeDeDiffusionIfNotExists(
      idConseiller: string,
      idListeDeDiffusion: string
    ): Promise<void>

    recupererConversationIndividuelle(
      idBeneficiaire: string
    ): Promise<ChatIndividuel | undefined>

    recupererConversationGroupe(
      idListeDeDiffusion: string
    ): Promise<ChatGroupe | undefined>

    envoyerMessageIndividuel(
      idChat: string,
      message: MessageIndividuel
    ): Promise<void>

    envoyerMessageGroupe(
      idGroupe: string,
      message: MessageGroupe
    ): Promise<void>

    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>

    supprimerChat(idJeune: string): Promise<void>

    supprimerListeDeDiffusion(idListe: string): Promise<void>

    envoyerMessageTransfert(jeune: Jeune): Promise<void>

    envoyerStatutAnalysePJ(
      idJeune: string,
      idMessage: string,
      statut: StatutAnalysePJ
    ): Promise<void>
  }

  export function creerMessage(aCreer: MessageACreer): MessageIndividuel {
    return {
      message: aCreer.message,
      iv: aCreer.iv,
      idConseiller: aCreer.idConseiller,
      type: aCreer.infoPieceJointe ? 'MESSAGE_PJ' : 'MESSAGE',
      infoPieceJointe: aCreer.infoPieceJointe
    }
  }

  export function creerMessageGroupe(
    aCreer: MessageGroupeACreer
  ): MessageGroupe {
    return {
      message: aCreer.message,
      iv: aCreer.iv,
      idConseiller: aCreer.idConseiller,
      type: aCreer.infoPieceJointe ? 'MESSAGE_PJ' : 'MESSAGE',
      infoPieceJointe: aCreer.infoPieceJointe,
      idsBeneficiaires: aCreer.idsBeneficiaires
    }
  }
}
