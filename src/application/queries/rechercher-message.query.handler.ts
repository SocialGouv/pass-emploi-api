import { Inject, Injectable } from '@nestjs/common'
import { FuseResult } from 'fuse.js'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { ResultatsRechercheMessageQueryModel } from 'src/application/queries/query-models/resultats-recherche-message-query.model'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import {
  Chat,
  ChatRepositoryToken,
  MessageRecherche,
  MessageRechercheMatches
} from 'src/domain/chat'
import { Evenement, EvenementService } from 'src/domain/evenement'
import * as process from 'process'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js')

export interface RechercherMessageQuery extends Query {
  idBeneficiaire: string
  recherche: string
}

@Injectable()
export class RechercherMessageQueryHandler extends QueryHandler<
  RechercherMessageQuery,
  Result<ResultatsRechercheMessageQueryModel>
> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private evenementService: EvenementService
  ) {
    super('RechercherMessageQueryHandler')
  }

  async handle(
    query: RechercherMessageQuery
  ): Promise<Result<ResultatsRechercheMessageQueryModel>> {
    const { idBeneficiaire, recherche } = query

    const messages = await this.chatRepository.recupererMessagesConversation(
      idBeneficiaire
    )

    const resultatRecherche = await chercherMessage(messages, recherche)

    return success({
      resultats: resultatRecherche.map(message => ({
        id: message.id,
        message: message.rawMessage,
        matches: message.matches
      }))
    })
  }

  async authorize(
    command: RechercherMessageQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return await this.conseillerAuthorizer.autoriserConseillerPourSonJeune(
      command.idBeneficiaire,
      utilisateur
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.RECHERCHE_MESSAGE,
      utilisateur
    )
  }
}

async function chercherMessage(
  messages: MessageRecherche[],
  recherche: string
): Promise<MessageRechercheMatches[]> {
  const results: Array<FuseResult<MessageRechercheMatches>> = new Fuse(
    messages,
    {
      keys: ['content', 'piecesJointes.nom'],
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      // eslint-disable-next-line no-process-env
      threshold: process.env.THRESHOLD_SEARCH_MESSAGES,
      minMatchCharLength: recherche.length
    }
  ).search(recherche)

  return results.map(fuseResult => {
    const matches = fuseResult.matches!.map(m => m.indices[0])

    return {
      ...fuseResult.item,
      matches
    }
  })
}
