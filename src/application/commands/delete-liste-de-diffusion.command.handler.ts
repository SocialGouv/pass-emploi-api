import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller } from '../../domain/conseiller'
import { ListeDeDiffusionRepositoryToken } from '../../domain/milo/liste-de-diffusion'
import { Evenement, EvenementService } from '../../domain/evenement'
import { ListeDeDiffusionAuthorizer } from '../authorizers/liste-de-diffusion-authorizer'

export interface DeleteListeDeDiffusionCommand extends Command {
  idListeDeDiffusion: string
}

@Injectable()
export class DeleteListeDeDiffusionCommandHandler extends CommandHandler<
  DeleteListeDeDiffusionCommand,
  void
> {
  constructor(
    private authorizeListeDeDiffusion: ListeDeDiffusionAuthorizer,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private readonly evenementService: EvenementService
  ) {
    super('DeleteListeDeDiffusionCommandHandler')
  }

  async authorize(
    { idListeDeDiffusion }: DeleteListeDeDiffusionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion(
      idListeDeDiffusion,
      utilisateur
    )
  }

  async handle({
    idListeDeDiffusion
  }: DeleteListeDeDiffusionCommand): Promise<Result> {
    await this.listeDeDiffusionRepository.delete(idListeDeDiffusion)
    await this.chatRepository.supprimerListeDeDiffusion(idListeDeDiffusion)
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.LISTE_DIFFUSION_SUPPRIMEE,
      utilisateur
    )
  }
}
