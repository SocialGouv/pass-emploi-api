import { Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Unauthorized } from '../../domain/erreur'

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
  }
  async handle(command: CreateEvenementCommand): Promise<void> {
    await this.evenementService.creerEvenement(
      command.type,
      command.emetteur.type
    )
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
}
