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
  SuiviJobs,
  SuiviJobsServiceToken
} from '../../../domain/suivi-jobs'
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
    @Inject(SuiviJobsServiceToken)
    suiviJobsService: SuiviJobs.Service
  ) {
    super('HandleNettoyerLesJobsCommandHandler', suiviJobsService)
  }

  async handle(): Promise<Result<NettoyageJobsStats>> {
    try {
      const maintenant = this.dateService.now()
      const stats = await this.planificateurRepository.supprimerLesJobsPasses()
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
