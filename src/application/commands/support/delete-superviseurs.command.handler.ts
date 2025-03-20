import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Result, emptySuccess } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import {
  Superviseur,
  SuperviseursRepositoryToken
} from '../../../domain/superviseur'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'

export interface DeleteSuperviseursCommand extends Command {
  emails: string[]
}

@Injectable()
export class DeleteSuperviseursCommandHandler extends CommandHandler<
  DeleteSuperviseursCommand,
  void
> {
  constructor(
    @Inject(SuperviseursRepositoryToken)
    private readonly superviseurRepository: Superviseur.Repository,
    private readonly supportAuthorizer: SupportAuthorizer
  ) {
    super('DeleteSuperviseursCommandHandler')
  }

  async handle(command: DeleteSuperviseursCommand): Promise<Result<void>> {
    await this.superviseurRepository.deleteSuperviseurs(command.emails)
    return emptySuccess()
  }

  async authorize(
    _command: DeleteSuperviseursCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
