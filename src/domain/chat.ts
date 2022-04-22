export const ChatRepositoryToken = 'ChatRepositoryToken'

export namespace Chat {
  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>
    getNombreDeConversationsNonLues(conseillerId: string): Promise<number>
    transfererChat(conseillerCibleId: string, jeuneIds: string[]): Promise<void>
    supprimerChat(idJeune: string): Promise<void>
  }
}
