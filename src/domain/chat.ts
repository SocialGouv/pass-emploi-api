import { ChatSecretsQueryModel } from 'src/application/queries/query-models/chat.query-models'
import { Authentification } from './authentification'

export const ChatRepositoryToken = 'ChatRepositoryToken'

export namespace Chat {
  export interface Repository {
    initializeChatIfNotExists(
      jeuneId: string,
      conseillerId: string
    ): Promise<void>
    getChatSecretsQueryModel(
      utilisateur: Authentification.Utilisateur
    ): Promise<ChatSecretsQueryModel | undefined>
  }
}
