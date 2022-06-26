import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  EmailExisteDejaError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Core } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface CreateJeuneCommand extends Command {
  idConseiller: string
  firstName: string
  lastName: string
  email: string
}

@Injectable()
export class CreerJeunePoleEmploiCommandHandler extends CommandHandler<
  CreateJeuneCommand,
  Jeune
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
    super('CreerJeunePoleEmploiCommandHandler')
  }

  async handle(command: CreateJeuneCommand): Promise<Result<Jeune>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    const lowerCaseEmail = command.email.toLocaleLowerCase()
    const jeune = await this.jeuneRepository.getByEmail(lowerCaseEmail)
    if (jeune) {
      return failure(new EmailExisteDejaError(lowerCaseEmail))
    }

    const nouveauJeune: Jeune = {
      id: this.idService.uuid(),
      firstName: command.firstName,
      lastName: command.lastName,
      email: lowerCaseEmail,
      isActivated: false,
      creationDate: this.dateService.now(),
      conseiller: {
        id: conseiller.id,
        lastName: conseiller.lastName,
        firstName: conseiller.firstName,
        email: conseiller.email
      },
      structure: Core.Structure.POLE_EMPLOI
    }
    await this.jeuneRepository.save(nouveauJeune)
    await this.chatRepository.initializeChatIfNotExists(
      nouveauJeune.id,
      nouveauJeune.conseiller!.id
    )
    return success(nouveauJeune)
  }

  async authorize(
    command: CreateJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      !(
        utilisateur.type === Authentification.Type.CONSEILLER &&
        utilisateur.structure === Core.Structure.POLE_EMPLOI
      )
    ) {
      return failure(new DroitsInsuffisants())
    }
    return this.conseillerAuthorizer.authorize(
      command.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
