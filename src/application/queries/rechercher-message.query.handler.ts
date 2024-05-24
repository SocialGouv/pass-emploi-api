import { Inject, Injectable } from '@nestjs/common'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Chat, ChatRepositoryToken, MessageRecherche } from 'src/domain/chat'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Query } from 'src/building-blocks/types/query'
import { ResultatsRechercheMessageQueryModel } from 'src/application/queries/query-models/resultats-recherche-message-query.model'
import { FuseResult } from 'fuse.js'

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
        message: message.rawMessage
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
): Promise<MessageRecherche[]> {
  const results: Array<FuseResult<MessageRecherche>> = new Fuse(messages, {
    keys: ['content', 'piecesJointes.nom'],
    ignoreLocation: true
  }).search(recherche)

  return results.map(fuseResult => fuseResult.item)
}
