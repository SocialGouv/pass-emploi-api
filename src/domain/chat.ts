export const ChatRepositoryToken = 'ChatRepositoryToken'

export namespace Chat {
  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>
    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>
    supprimerChat(idJeune: string): Promise<void>
  }
}
