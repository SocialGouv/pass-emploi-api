import { Inject, Injectable } from '@nestjs/common'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { EvenementEngagementHebdoSqlModel } from '../../../infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { DateService } from '../../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.NETTOYER_EVENEMENTS_CHARGES_ANALYTICS)
export class NettoyerEvenementsChargesAnalyticsJobHandler extends JobHandler<Planificateur.Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(
      Planificateur.JobType.NETTOYER_EVENEMENTS_CHARGES_ANALYTICS,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()

    try {
      await EvenementEngagementHebdoSqlModel.truncate()
    } catch (e) {
      return {
        jobType: this.jobType,
        dateExecution: maintenant,
        succes: false,
        resultat: {},
        nbErreurs: 1,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        erreur: e
      }
    }

    return {
      jobType: this.jobType,
      dateExecution: maintenant,
      succes: true,
      resultat: {},
      nbErreurs: 0,
      tempsExecution: DateService.calculerTempsExecution(maintenant)
    }
  }
}
