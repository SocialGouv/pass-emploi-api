import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Chat, ChatsRepositoryToken } from '../../domain/chat'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'

export interface LoginJeuneCommand extends Command {
  idJeune: string
}

@Injectable()
export class LoginJeuneCommandHandler
  implements CommandHandler<LoginJeuneCommand, Jeune | undefined>
{
  constructor(
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(ChatsRepositoryToken) private chatRepository: Chat.Repository
  ) {}

  async execute(command: LoginJeuneCommand): Promise<Jeune | undefined> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return undefined
    }
    await this.chatRepository.initializeChatIfNotExists(
      jeune.id,
      jeune.conseiller.id
    )
    return jeune
  }
}
