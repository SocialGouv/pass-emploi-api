import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { DateTime } from 'luxon'
import { Op, WhereOptions } from 'sequelize'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { ArchiveJeuneSqlModel } from '../../../infrastructure/sequelize/models/archive-jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class HandleJobNettoyerLesDonneesCommandHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()

    const nombreArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
      where: dateArchivageSuperieureADeuxAns(maintenant)
    })

    const nombreLogsApiSupprimees = await LogApiPartenaireSqlModel.destroy({
      where: dateSuperieureAUnMois(maintenant)
    })

    const stats = {
      nombreArchivesSupprimees,
      nombreLogsApiSupprimees
    }

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: maintenant.diffNow().milliseconds * -1,
      resultat: stats
    }
  }
}

function dateArchivageSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    dateArchivage: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateSuperieureAUnMois(maintenant: DateTime): WhereOptions {
  return {
    date: { [Op.lt]: maintenant.minus({ month: 1 }).toJSDate() }
  }
}
