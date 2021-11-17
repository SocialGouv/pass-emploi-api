export const ChatsRepositoryToken = 'ChatsRepositoryToken'

export namespace Chat {
  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>
  }
}
