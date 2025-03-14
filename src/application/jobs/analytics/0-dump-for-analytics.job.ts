import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  ProcessJobType
} from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { promisify } from 'util'
import { exec } from 'child_process'

@Injectable()
@ProcessJobType(Planificateur.JobType.DUMP_ANALYTICS)
export class DumpForAnalyticsJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.DUMP_ANALYTICS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()

    const cmd = 'yarn run dump-restore-db'
    const { stdout, stderr } = await promisify(exec)(cmd)

    if (stdout) {
      this.logger.log(stdout)
    }

    if (stderr) {
      this.logger.error(stderr)
      erreur = stderr
    }

    const jobChargementAnalytics: Planificateur.Job<void> = {
      dateExecution: this.dateService.nowJs(),
      type: Planificateur.JobType.CHARGER_EVENEMENTS_ANALYTICS,
      contenu: undefined
    }
    await this.planificateurRepository.ajouterJob(jobChargementAnalytics)

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: erreur ? false : true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {}
    }
  }
}
