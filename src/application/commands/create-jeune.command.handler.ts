import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { EmailExisteDejaError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { NotFound } from 'src/domain/erreur'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface CreateJeuneCommand extends Command {
  idConseiller: string
  firstName: string
  lastName: string
  email: string
}

@Injectable()
export class CreateJeuneCommandHandler extends CommandHandler<
  CreateJeuneCommand,
  Result<Jeune>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private idService: IdService,
    private dateService: DateService
  ) {
    super()
  }

  async handle(command: CreateJeuneCommand): Promise<Result<Jeune>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      throw new NotFound(command.idConseiller, 'Conseiller')
    }
    const jeune = await this.jeuneRepository.getByEmail(command.email)
    if (jeune) {
      return failure(new EmailExisteDejaError(command.email))
    }

    const nouveauJeune: Jeune = {
      id: this.idService.generate(),
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      creationDate: this.dateService.now(),
      conseiller,
      structure: Core.Structure.PASS_EMPLOI
    }
    await this.jeuneRepository.save(nouveauJeune)
    await this.chatRepository.initializeChatIfNotExists(
      nouveauJeune.id,
      nouveauJeune.conseiller.id
    )
    return success(nouveauJeune)
  }

  async authorize(
    command: CreateJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(command.idConseiller, utilisateur)
  }
}
