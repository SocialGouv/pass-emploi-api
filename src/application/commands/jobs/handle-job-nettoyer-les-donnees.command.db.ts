import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op, Sequelize, WhereOptions } from 'sequelize'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import { JobTypeCommand } from '../../../domain/planificateur'
import { SuiviJobs, SuiviJobsServiceToken } from '../../../domain/suivi-jobs'
import { ArchiveJeuneSqlModel } from '../../../infrastructure/sequelize/models/archive-jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { SuiviJobsSqlModel } from '../../../infrastructure/sequelize/models/suivi-jobs.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class HandleJobNettoyerLesDonneesCommandHandler extends CommandHandler<
  JobTypeCommand,
  Stats
> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobsServiceToken)
    suiviJobsService: SuiviJobs.Service,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('HandleJobNettoyerLesDonneesCommandHandler', suiviJobsService)
  }

  async handle(command: JobTypeCommand): Promise<Result<Stats>> {
    const maintenant = this.dateService.now()

    const nombreArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
      where: dateArchivageSuperieureADeuxAns(maintenant)
    })

    const nombreLogsApiSupprimees = await LogApiPartenaireSqlModel.destroy({
      where: dateSuperieureAUnMois(maintenant)
    })

    const stats = {
      tempsDExecution: maintenant.diffNow().milliseconds * -1,
      nombreArchivesSupprimees,
      nombreLogsApiSupprimees
    }

    await SuiviJobsSqlModel.create({
      jobType: command.jobType,
      dateExecution: maintenant.toJSDate(),
      succes: true,
      resultat: stats,
      nbErreurs: 0,
      tempsExecution: stats.tempsDExecution
    })

    return success(stats)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  nombreArchivesSupprimees: number
  nombreLogsApiSupprimees: number
  tempsDExecution?: number
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
