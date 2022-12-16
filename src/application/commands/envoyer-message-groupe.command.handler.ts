import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { AuthorizeConseillerForJeunes } from '../authorizers/authorize-conseiller-for-jeunes'
import { Evenement, EvenementService } from '../../domain/evenement'

export interface EnvoyerMessageGroupeCommand extends Command {
  idsBeneficiaires: string[]
  message: string
  iv: string
  idConseiller: string
  infoPieceJointe?: {
    id: string
    nom: string
  }
}

@Injectable()
export class EnvoyerMessageGroupeCommandHandler extends CommandHandler<
  EnvoyerMessageGroupeCommand,
  void
> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private authorizeConseillerForJeunes: AuthorizeConseillerForJeunes,
    private evenementService: EvenementService
  ) {
    super('EnvoyerMessageGroupeCommandHandler')
  }

  async handle(command: EnvoyerMessageGroupeCommand): Promise<Result> {
    const { idsBeneficiaires } = command

    const chats = await Promise.all(
      idsBeneficiaires.map(id => this.chatRepository.recupererChat(id))
    )

    const chatMessage = Chat.creerMessage(command)

    if (isFailure(chatMessage)) {
      return chatMessage
    }

    await Promise.all(
      chats
        .filter(isDefined)
        .map(({ id: idChat }) =>
          this.chatRepository.envoyerMessageBeneficiaire(
            idChat,
            chatMessage.data
          )
        )
    )

    return emptySuccess()
  }

  async authorize(
    command: EnvoyerMessageGroupeCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizeConseillerForJeunes.authorize(
      command.idsBeneficiaires,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: EnvoyerMessageGroupeCommand
  ): Promise<void> {
    let code: Evenement.Code = Evenement.Code.MESSAGE_ENVOYE

    if (command.idsBeneficiaires.length > 1) {
      if (command.infoPieceJointe) {
        code = Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_PJ
      } else {
        code = Evenement.Code.MESSAGE_ENVOYE_MULTIPLE
      }
    } else if (command.infoPieceJointe) {
      code = Evenement.Code.MESSAGE_ENVOYE_PJ
    }
    await this.evenementService.creer(code, utilisateur)
  }
}

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}
