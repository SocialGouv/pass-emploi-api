import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Chat, ChatsRepositoryToken } from '../../domain/chat'

export interface CreateJeuneCommand extends Command {
  idConseiller: string
  firstName: string
  lastName: string
}

@Injectable()
export class CreateJeuneCommandHandler
  implements CommandHandler<CreateJeuneCommand, Jeune>
{
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ChatsRepositoryToken)
    private chatRepository: Chat.Repository,
    private idService: IdService,
    private dateService: DateService
  ) {}

  async execute(command: CreateJeuneCommand): Promise<Jeune> {
    const jeune: Jeune = {
      id: this.idService.generate(),
      firstName: command.firstName,
      lastName: command.lastName,
      creationDate: this.dateService.now(),
      conseiller: await this.conseillerRepository.get(command.idConseiller)
    }
    await this.jeuneRepository.save(jeune)
    await this.chatRepository.initializeChatIfNotExists(
      jeune.id,
      jeune.conseiller.id
    )
    return jeune
  }
}
