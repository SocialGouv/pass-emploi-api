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

export interface EnvoyerMessageGroupeCommand extends Command {
  idsBeneficiaires: string[]
  message: string
  iv: string
  idConseiller: string
  typeMessage: Chat.TypeMessage
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
    private chatRepository: Chat.Repository
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
    _command: EnvoyerMessageGroupeCommand,
    _utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}
