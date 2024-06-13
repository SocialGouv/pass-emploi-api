import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FuseResult } from 'fuse.js'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import {
  MessageIndividuelQueryModel,
  ResultatsRechercheMessageQueryModel
} from 'src/application/queries/query-models/resultats-recherche-message-query.model'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Chat, ChatRepositoryToken, MessageRecherche } from 'src/domain/chat'
import { Evenement, EvenementService } from 'src/domain/evenement'

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
    private evenementService: EvenementService,
    private configService: ConfigService
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

    const resultatRecherche = await this.chercherMessage(messages, recherche)

    return success({
      resultats: resultatRecherche
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

  async chercherMessage(
    messages: MessageRecherche[],
    recherche: string
  ): Promise<MessageIndividuelQueryModel[]> {
    const results: Array<FuseResult<MessageRecherche>> = new Fuse(messages, {
      keys: ['content', 'piecesJointes.nom'],
      includeMatches: true,
      ignoreLocation: true,
      threshold: this.configService.get('recherche.seuil'),
      minMatchCharLength: recherche.length
    }).search(recherche)

    return results.map(fuseResult => {
      const matches = fuseResult.matches!.map(({ indices, key }) => {
        return {
          match: indices[0],
          key
        }
      })
      const { idConversation, id, rawMessage } = fuseResult.item

      return {
        id: id,
        idConversation: idConversation,
        message: rawMessage,
        matches
      }
    })
  }
}
