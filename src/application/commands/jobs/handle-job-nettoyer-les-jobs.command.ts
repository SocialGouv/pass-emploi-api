import { Inject, Injectable } from '@nestjs/common'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../../domain/planificateur'
import {
  NettoyageJobsStats,
  NotificationSupport,
  NotificationSupportServiceToken
} from '../../../domain/notification-support'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class HandleNettoyerLesJobsCommandHandler extends CommandHandler<
  Command,
  NettoyageJobsStats
> {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service
  ) {
    super('HandleNettoyerLesJobsCommandHandler', notificationSupportService)
  }

  async handle(): Promise<Result<NettoyageJobsStats>> {
    try {
      const maintenant = this.dateService.now()
      const stats = await this.planificateurRepository.supprimerLesAnciensJobs()
      stats.tempsDExecution = maintenant.diffNow().milliseconds * -1
      return success(stats)
    } catch (e) {
      return failure(e)
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
