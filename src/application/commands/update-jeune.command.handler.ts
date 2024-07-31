import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export interface UpdateJeuneCommand extends Command {
  idJeune: string
  dateSignatureCGU?: string
}

@Injectable()
export class UpdateJeuneCommandHandler extends CommandHandler<
  UpdateJeuneCommand,
  void
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('UpdateJeuneCommandHandler')
  }

  async handle(command: UpdateJeuneCommand): Promise<Result> {
    const jeuneActuel = await this.jeuneRepository.get(command.idJeune)
    if (!jeuneActuel) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const jeuneAJour: Jeune = {
      ...jeuneActuel,
      dateSignatureCGU: command.dateSignatureCGU
        ? DateTime.fromISO(command.dateSignatureCGU)
        : jeuneActuel.dateSignatureCGU
    }
    await this.jeuneRepository.save(jeuneAJour)
    return emptySuccess()
  }

  async authorize(
    command: UpdateJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
