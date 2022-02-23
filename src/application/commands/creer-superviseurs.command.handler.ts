import { Inject, Injectable } from '@nestjs/common'
import {
  Superviseur,
  SuperviseursRepositoryToken
} from 'src/domain/superviseur'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'

export interface CreerSuperviseursCommand extends Command {
  superviseurs: Superviseur[]
}

@Injectable()
export class CreerSuperviseursCommandHandler extends CommandHandler<
  CreerSuperviseursCommand,
  void
> {
  constructor(
    @Inject(SuperviseursRepositoryToken)
    private readonly superviseurRepository: Superviseur.Repository
  ) {
    super('CreerSuperviseursCommandHandler')
  }

  async handle(command: CreerSuperviseursCommand): Promise<Result<void>> {
    await this.superviseurRepository.saveSuperviseurs(command.superviseurs)
    return emptySuccess()
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: CreerSuperviseursCommand
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
