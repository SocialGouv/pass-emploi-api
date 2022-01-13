import { Injectable, Logger } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { LogEvent, LogEventKey } from '../../building-blocks/types/log.event'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Unauthorized } from '../../domain/erreur'
import { Evenement, EvenementService } from '../../domain/evenement'

export interface CreateEvenementCommand extends Command {
  type: Evenement.Type
  emetteur: {
    id: string
    type: Authentification.Type
    structure: Core.Structure
  }
}

@Injectable()
export class CreateEvenementCommandHandler extends CommandHandler<
  CreateEvenementCommand,
  void
> {
  constructor(private evenementService: EvenementService) {
    super()
    this.logger = new Logger('CreateEvenementCommandHandler')
  }

  async handle(command: CreateEvenementCommand): Promise<Result<void>> {
    const event = new LogEvent(LogEventKey.USER_EVENT, command)
    this.logger.log(event)
    return emptySuccess()
  }

  async authorize(
    command: CreateEvenementCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const memeType = command.emetteur.type === utilisateur.type
    const memeStructure = command.emetteur.structure === utilisateur.structure
    const memeId = command.emetteur.id === utilisateur.id
    if (memeType && memeStructure && memeId) {
      return
    }
    throw new Unauthorized('évènement')
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateEvenementCommand
  ): Promise<void> {
    await this.evenementService.creerEvenement(command.type, utilisateur)
  }
}
