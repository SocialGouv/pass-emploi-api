import { Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Notification } from '../../domain/notification/notification'
import { Core } from '../../domain/core'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
export interface NotifierBeneficiairesCommand extends Command {
  type: Notification.Type
  titre: string
  description: string
  structures: Core.Structure[]
  push: boolean
  batchSize: number
}

@Injectable()
export class NotifierBeneficiairesCommandHandler extends CommandHandler<
  NotifierBeneficiairesCommand,
  void
> {
  constructor(
    private type: Notification.Type.OUTILS,
    private titre: string,
    private description: string,
    private structures: Core.Structure[],
    private push: boolean,
    private batchSize?: number,
    private minutesEntreLesBatchs?: number
  ) {
    super('NotifierBeneficiairesCommandHandler')
  }

  async handle(_command: NotifierBeneficiairesCommand): Promise<Result> {
    return failure(new NonTrouveError('test'))
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
