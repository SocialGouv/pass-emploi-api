import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NotFound } from '../../domain/erreur'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { DateService } from '../../utils/date-service'

export interface UpdateNotificationTokenCommand extends Command {
  idJeune: string
  token: string
}

@Injectable()
export class UpdateNotificationTokenCommandHandler
  implements CommandHandler<UpdateNotificationTokenCommand, void>
{
  constructor(
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    private dateService: DateService
  ) {}

  async execute(command: UpdateNotificationTokenCommand): Promise<void> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      throw new NotFound(command.idJeune, 'Jeune')
    }

    const jeuneMisAJour = Jeune.updateToken(
      jeune,
      command.token,
      this.dateService
    )
    await this.jeuneRepository.save(jeuneMisAJour)
  }
}
