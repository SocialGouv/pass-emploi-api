import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller } from '../../domain/conseiller/conseiller'
import { ListeDeDiffusionRepositoryToken } from '../../domain/conseiller/liste-de-diffusion'
import { AuthorizeListeDeDiffusion } from '../authorizers/authorize-liste-de-diffusion'

export interface DeleteListeDeDiffusionCommand extends Command {
  idListeDeDiffusion: string
}

@Injectable()
export class DeleteListeDeDiffusionCommandHandler extends CommandHandler<
  DeleteListeDeDiffusionCommand,
  void
> {
  constructor(
    private authorizeListeDeDiffusion: AuthorizeListeDeDiffusion,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository
  ) {
    super('DeleteListeDeDiffusionCommandHandler')
  }

  async authorize(
    { idListeDeDiffusion }: DeleteListeDeDiffusionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizeListeDeDiffusion.authorize(
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

  async monitor(): Promise<void> {
    return
  }
}