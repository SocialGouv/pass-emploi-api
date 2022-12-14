import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'

export interface EnvoyerMessageGroupeCommand extends Command {
  idsBeneficiaires: string[]
  message: string
  iv: string
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
    const { message, iv, idsBeneficiaires } = command

    const chats = await Promise.all(
      idsBeneficiaires.map(this.chatRepository.recupererChat)
    )
    await Promise.all(
      chats.map(({ id: idChat }) =>
        this.chatRepository.envoyerMessageBeneficiaire(idChat, {
          message: message,
          iv: iv
        })
      )
    )

    return emptySuccess()
  }

  async authorize(
    _command: EnvoyerMessageGroupeCommand,
    _utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return failure(new DroitsInsuffisants())
  }

  async monitor(): Promise<void> {
    return
  }
}
