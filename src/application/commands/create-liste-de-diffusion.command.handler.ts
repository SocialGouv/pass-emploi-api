import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Conseiller } from '../../domain/conseiller'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Inject, Injectable } from '@nestjs/common'
import { ListeDeDiffusionRepositoryToken } from '../../domain/milo/liste-de-diffusion'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

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
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private listeDeDiffusionFactory: Conseiller.ListeDeDiffusion.Factory,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private readonly evenementService: EvenementService
  ) {
    super('CreateListeDeDiffusionCommandHandler')
  }

  async authorize(
    command: CreateListeDeDiffusionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserConseillerPourSesJeunes(
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

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.LISTE_DIFFUSION_CREEE,
      utilisateur
    )
  }
}
