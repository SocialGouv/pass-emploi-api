import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Notification } from '../../domain/notification/notification'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../domain/planificateur'
import { DateService } from '../../utils/date-service'
import { Core } from '../../domain/core'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import JobNotifierBeneficiaires = Planificateur.JobNotifierBeneficiaires

export interface NotifierBeneficiairesCommand extends Command {
  typeNotification: Notification.Type
  titre: string
  description: string
  structures?: Core.Structure[]
  push?: boolean
  batchSize?: number
  minutesEntreLesBatchs?: number
}

@Injectable()
export class NotifierBeneficiairesCommandHandler extends CommandHandler<
  NotifierBeneficiairesCommand,
  Planificateur.JobId
> {
  constructor(
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('NotifierBeneficiairesCommandHandler')
  }

  async handle(
    command: NotifierBeneficiairesCommand
  ): Promise<Result<Planificateur.JobId>> {
    if (command.push === true && !command.structures) {
      return failure(
        new MauvaiseCommandeError(
          `Une notif push doit cibler des structures en particulier.`
        )
      )
    }
    if (
      command.push === true &&
      command.typeNotification === Notification.Type.CENTRE_DE_NOTIFS_UNIQUEMENT
    ) {
      return failure(
        new MauvaiseCommandeError(
          `Une notif push doit etre de type different de CENTRE_DE_NOTIFS_UNIQUEMENT.`
        )
      )
    }
    const jobDejaPlanifieId =
      await this.planificateurRepository.recupererPremierJobNonTermine(
        Planificateur.JobType.NOTIFIER_BENEFICIAIRES
      )
    if (jobDejaPlanifieId !== null)
      return failure(
        new MauvaiseCommandeError(
          `Un job de type NOTIFIER_BENEFICIAIRES est déjà planifié (id=${jobDejaPlanifieId}).`
        )
      )

    const maintenant = this.dateService.now()
    const contenu: JobNotifierBeneficiaires = {
      ...command,
      typeNotification:
        command.typeNotification ??
        Notification.Type.CENTRE_DE_NOTIFS_UNIQUEMENT
    }
    const jobId = await this.planificateurRepository.ajouterJob({
      dateExecution: maintenant.toJSDate(),
      type: Planificateur.JobType.NOTIFIER_BENEFICIAIRES,
      contenu
    })

    return success({ jobId: jobId })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
