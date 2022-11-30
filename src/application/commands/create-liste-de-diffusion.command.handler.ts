import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Command } from '../../building-blocks/types/command'

export interface CreateListeDeDiffusionCommand extends Command {
  idConseiller: string
  idsBeneficiaires: string[]
}

export class CreateListeDeDiffusionCommandHandler extends CommandHandler<
  CreateListeDeDiffusionCommand,
  void
> {
  constructor() {
    super('CreateListeDeDiffusionCommandHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(_command: CreateListeDeDiffusionCommand): Promise<Result<void>> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
