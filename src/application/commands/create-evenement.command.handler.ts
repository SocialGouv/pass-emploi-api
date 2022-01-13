import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from 'src/building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
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
    super('CreateEvenementCommandHandler')
  }
  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: CreateEvenementCommand
  ): Promise<Result<void>> {
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
