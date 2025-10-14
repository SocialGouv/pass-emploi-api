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

export interface CreerSuperviseursCommand extends Command {
  emails: string[]
}

@Injectable()
export class CreerSuperviseursCommandHandler extends CommandHandler<
  CreerSuperviseursCommand,
  void
> {
  constructor(
    @Inject(SuperviseursRepositoryToken)
    private readonly superviseurRepository: Superviseur.Repository,
    private readonly supportAuthorizer: SupportAuthorizer
  ) {
    super('CreerSuperviseursCommandHandler')
  }

  async handle(command: CreerSuperviseursCommand): Promise<Result> {
    if (command.emails.length) {
      await this.superviseurRepository.saveSuperviseurs(command.emails)
    }
    return emptySuccess()
  }

  async authorize(
    _command: CreerSuperviseursCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
