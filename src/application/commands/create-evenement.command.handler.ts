import { Injectable, Logger } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Evenements } from '../../domain/evenements'
import { Unauthorized } from '../../domain/erreur'

export interface CreateEvenementCommand extends Command {
  type: Evenements.Type
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
  private logger: Logger

  constructor() {
    super()
    this.logger = new Logger('CreateEvenementCommandHandler')
  }
  async handle(command: CreateEvenementCommand): Promise<void> {
    this.logger.log(command)
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
    throw new Unauthorized("Emetteur ne correspond pas à l'utilisateur")
  }
}
