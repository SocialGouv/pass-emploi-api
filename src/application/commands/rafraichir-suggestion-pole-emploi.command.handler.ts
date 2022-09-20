import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Injectable } from '@nestjs/common'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'

export interface RafraichirSuggestionPoleEmploiCommand extends Command {
  idJeune: string
  token: string
}

@Injectable()
export class RafraichirSuggestionPoleEmploiCommandHandler extends CommandHandler<
  RafraichirSuggestionPoleEmploiCommand,
  void
> {
  constructor(private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer) {
    super('RafraichirSuggestionPoleEmploiCommandHandler')
  }

  async handle(
    _command: RafraichirSuggestionPoleEmploiCommand
  ): Promise<Result> {
    return emptySuccess()
  }

  authorize(
    command: RafraichirSuggestionPoleEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(
      command.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
