import { Inject, Injectable } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Planificateur, PlanificateurService } from '../../domain/planificateur'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'

export interface HandleJobMailConseillerCommand extends Command {
  job: Planificateur.Job<Planificateur.JobMailConseiller>
}

@Injectable()
export class HandleJobMailConseillerCommandHandler extends CommandHandler<
  HandleJobMailConseillerCommand,
  void
> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    private planificateurService: PlanificateurService
  ) {
    super('HandleJobMailConseillerCommandHandler')
  }

  async handle(command: HandleJobMailConseillerCommand): Promise<Result> {
    this.planificateurService.planifierJobRappelMail(
      command.job.contenu.idConseiller
    )

    const nombreDeConversationsNonLues =
      await this.chatRepository.getNombreDeConversationsNonLues(
        command.job.contenu.idConseiller
      )

    if (nombreDeConversationsNonLues === 0) {
      return emptySuccess()
    }

    await this.conseillerRepository.envoyerUnRappelParMail(
      command.job.contenu.idConseiller,
      nombreDeConversationsNonLues
    )

    return emptySuccess()
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: HandleJobMailConseillerCommand
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
