import { Inject, Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.DUMP_PERFS)
export class DumpForPerfsJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.DUMP_PERFS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur
    const maintenant = this.dateService.now()

    const cmd = 'yarn run dump-restore-db-perfs'
    const { stdout, stderr } = await promisify(exec)(cmd)

    if (stdout) {
      this.logger.log(stdout)
    }

    if (stderr) {
      this.logger.error(stderr)
      erreur = stderr
    }

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
