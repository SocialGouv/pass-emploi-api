import { Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ChatSecretsQueryModel } from './query-models/authentification.query-models'
import { FirebaseClient } from '../../infrastructure/clients/firebase-client'
import { ConfigService } from '@nestjs/config'

export interface GetChatSecretsQuery extends Query {
  utilisateur: Authentification.Utilisateur
}

@Injectable()
export class GetChatSecretsQueryHandler extends QueryHandler<
  GetChatSecretsQuery,
  ChatSecretsQueryModel | undefined
> {
  constructor(
    private firebaseClient: FirebaseClient,
    private configService: ConfigService
  ) {
    super('GetChatSecretsQueryHandler')
  }

  async handle(
    query: GetChatSecretsQuery
  ): Promise<ChatSecretsQueryModel | undefined> {
    const firebaseToken = await this.firebaseClient.getToken(query.utilisateur)
    const encryptionKey = this.configService.get('firebase').encryptionKey

    return firebaseToken && encryptionKey
      ? {
          token: firebaseToken,
          cle: encryptionKey
        }
      : undefined
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
