import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'
import { Authentification } from '../../domain/authentification'
import { AuthorizeConseillerForJeunes } from '../authorizers/authorize-conseiller-for-jeunes'
import { Conseiller } from '../../domain/conseiller/conseiller'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Inject, Injectable } from '@nestjs/common'
import { ListeDeDiffusionRepositoryToken } from '../../domain/conseiller/liste-de-diffusion'

export interface CreateListeDeDiffusionCommand extends Command {
  idConseiller: string
  titre: string
  idsBeneficiaires: string[]
}

@Injectable()
export class CreateListeDeDiffusionCommandHandler extends CommandHandler<
  CreateListeDeDiffusionCommand,
  void
> {
  constructor(
    private conseillerForJeunesAuthorizer: AuthorizeConseillerForJeunes,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private listeDeDiffusionFactory: Conseiller.ListeDeDiffusion.Factory,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository
  ) {
    super('CreateListeDeDiffusionCommandHandler')
  }

  async authorize(
    command: CreateListeDeDiffusionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerForJeunesAuthorizer.authorize(
      command.idsBeneficiaires,
      utilisateur
    )
  }

  async handle(command: CreateListeDeDiffusionCommand): Promise<Result<void>> {
    const listeDeDiffusion = this.listeDeDiffusionFactory.creer(command)
    await this.listeDeDiffusionRepository.save(listeDeDiffusion)

    await this.chatRepository.initializeListeDeDiffusionIfNotExists(
      command.idConseiller,
      listeDeDiffusion.id
    )
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
