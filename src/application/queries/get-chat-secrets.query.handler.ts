import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Chat, ChatRepositoryToken } from 'src/domain/chat'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ChatSecretsQueryModel } from './query-models/authentification.query-models'

export interface GetChatSecretsQuery extends Query {
  utilisateur: Authentification.Utilisateur
}

@Injectable()
export class GetChatSecretsQueryHandler extends QueryHandler<
  GetChatSecretsQuery,
  ChatSecretsQueryModel | undefined
> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository
  ) {
    super()
  }

  async handle(
    query: GetChatSecretsQuery
  ): Promise<ChatSecretsQueryModel | undefined> {
    return await this.chatRepository.getChatSecretsQueryModel(query.utilisateur)
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: GetChatSecretsQuery
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
