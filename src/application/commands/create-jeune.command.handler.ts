import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Chat, ChatsRepositoryToken } from '../../domain/chat'
import { NotFound } from 'src/domain/erreur'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface CreateJeuneCommand extends Command {
  idConseiller: string
  firstName: string
  lastName: string
}

@Injectable()
export class CreateJeuneCommandHandler extends CommandHandler<
  CreateJeuneCommand,
  Jeune
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ChatsRepositoryToken)
    private chatRepository: Chat.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private idService: IdService,
    private dateService: DateService
  ) {
    super()
  }

  async handle(command: CreateJeuneCommand): Promise<Jeune> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      throw new NotFound(command.idConseiller, 'Conseiller')
    }

    const jeune: Jeune = {
      id: this.idService.generate(),
      firstName: command.firstName,
      lastName: command.lastName,
      creationDate: this.dateService.now(),
      conseiller
    }
    await this.jeuneRepository.save(jeune)
    await this.chatRepository.initializeChatIfNotExists(
      jeune.id,
      jeune.conseiller.id
    )
    return jeune
  }

  async authorize(
    command: CreateJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(command.idConseiller, utilisateur)
  }
}
