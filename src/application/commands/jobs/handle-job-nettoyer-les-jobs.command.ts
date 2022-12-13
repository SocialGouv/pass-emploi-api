import { Inject, Injectable } from '@nestjs/common'
import { Job } from '../../../building-blocks/types/job'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class HandleNettoyerLesJobsCommandHandler extends JobHandler<Job> {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.NETTOYER_LES_JOBS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    let stats = {}
    const maintenant = this.dateService.now()

    try {
      stats = await this.planificateurRepository.supprimerLesJobsPasses()
    } catch (e) {
      erreur = e
    }

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: erreur ? false : true,
      dateExecution: maintenant,
      tempsExecution: DateService.caculerTempsExecution(maintenant),
      resultat: erreur ?? stats
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
