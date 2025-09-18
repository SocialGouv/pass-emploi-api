import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Notification } from '../../domain/notification/notification'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../domain/planificateur'
import { DateService } from '../../utils/date-service'
import JobNotifierBeneficiaires = Planificateur.JobNotifierBeneficiaires
import { Jeune } from '../../domain/jeune/jeune'

export interface NotifierBeneficiairesCommand extends Command {
  type: Notification.Type
  titre: string
  description: string
  dispositifs: Jeune.Dispositif[]
  push: boolean
  batchSize?: number
  minutesEntreLesBatchs?: number
}

@Injectable()
export class NotifierBeneficiairesCommandHandler extends CommandHandler<
  NotifierBeneficiairesCommand,
  void
> {
  constructor(
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('NotifierBeneficiairesCommandHandler')
  }

  async handle(command: NotifierBeneficiairesCommand): Promise<Result> {
    const maintenant = this.dateService.now()
    const contenu: JobNotifierBeneficiaires = { ...command }
    await this.planificateurRepository.ajouterJob({
      dateExecution: maintenant.toJSDate(),
      type: Planificateur.JobType.NOTIFIER_BENEFICIAIRES,
      contenu
    })

    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
