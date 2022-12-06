import { Jeune } from './jeune/jeune'

export const ChatRepositoryToken = 'ChatRepositoryToken'

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
    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>
    supprimerChat(idJeune: string): Promise<void>
    supprimerListeDeDiffusion(idListe: string): Promise<void>
    envoyerMessageTransfert(jeune: Jeune): Promise<void>
  }
}
