import { Inject, Injectable } from '@nestjs/common'
import { DateService } from '../../utils/date-service'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Job } from '../../building-blocks/types/job'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'

@Injectable()
@ProcessJobType(Planificateur.JobType.FAKE)
export class FakeJobHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.FAKE, suiviJobService)
  }

  async handle(job: Job): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    this.logger.log({
      job,
      msg: 'executed'
    })
    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: maintenant.diffNow().milliseconds * -1,
      resultat: {}
    }
  }
}
