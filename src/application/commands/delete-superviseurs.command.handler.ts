import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import {
  Superviseur,
  SuperviseursRepositoryToken
} from 'src/domain/superviseur'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { SupportAuthorizer } from '../authorizers/authorize-support'

export interface DeleteSuperviseursCommand extends Command {
  superviseurs: Superviseur[]
}

@Injectable()
export class DeleteSuperviseursCommandHandler extends CommandHandler<
  DeleteSuperviseursCommand,
  void
> {
  constructor(
    @Inject(SuperviseursRepositoryToken)
    private readonly superviseurRepository: Superviseur.Repository,
    private supportAuthorizer: SupportAuthorizer
  ) {
    super('DeleteSuperviseursCommandHandler')
  }

  async handle(command: DeleteSuperviseursCommand): Promise<Result<void>> {
    await this.superviseurRepository.deleteSuperviseurs(command.superviseurs)
    return emptySuccess()
  }

  async authorize(
    _command: DeleteSuperviseursCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.authorize(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
