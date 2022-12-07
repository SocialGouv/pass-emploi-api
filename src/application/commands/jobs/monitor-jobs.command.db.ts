import { Inject, Injectable } from '@nestjs/common'
import { parseExpression } from 'cron-parser'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'
import {
  JobTypeCommand,
  listeCronJobs,
  Planificateur
} from '../../../domain/planificateur'
import {
  RapportJob24h,
  SuiviJobs,
  SuiviJobsServiceToken
} from '../../../domain/suivi-jobs'
import { SuiviJobsSqlModel } from '../../../infrastructure/sequelize/models/suivi-jobs.sql-model'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class MonitorJobsCommandHandler extends CommandHandler<
  JobTypeCommand,
  void
> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobsServiceToken)
    private suiviJobsService: SuiviJobs.Service
  ) {
    super('MonitorJobsCommandHandler')
  }

  async handle(_command: JobTypeCommand): Promise<Result> {
    const maintenant = this.dateService.now()
    const ilYa24h = maintenant.minus({ hours: 24 })

    const rapportJobs: RapportJob24h[] = []

    for (const cron of listeCronJobs) {
      const suiviDernieres24hSql = await SuiviJobsSqlModel.findAll({
        where: {
          jobType: cron.type,
          dateExecution: {
            [Op.lte]: maintenant.toJSDate(),
            [Op.gte]: ilYa24h.toJSDate()
          }
        },
        order: [['date_execution', 'ASC']]
      })

      const nbExecutionsAttendues = recupererNombreExecutionsDernieres24h(
        cron.type
      )
      const nbErreurs = suiviDernieres24hSql.reduce(
        (acc, curr) => acc + curr.nbErreurs,
        0
      )
      const nbEchecs = suiviDernieres24hSql.reduce(
        (acc, curr) => acc + (curr.succes ? 0 : 1),
        0
      )

      const datesExecutions = suiviDernieres24hSql.map(suivi =>
        DateTime.fromJSDate(suivi.dateExecution)
      )

      rapportJobs.push({
        jobType: cron.type,
        nbExecutionsAttendues,
        nbExecutions: suiviDernieres24hSql.length,
        nbErreurs,
        nbEchecs,
        datesExecutions
      })
    }

    await this.suiviJobsService.envoyerRapport(rapportJobs)

    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

function recupererNombreExecutionsDernieres24h(
  jobTypeRecherche: Planificateur.JobType
): number {
  const expressionRecherchee = listeCronJobs.find(
    cron => cron.type === jobTypeRecherche
  )?.expression

  if (!expressionRecherchee) {
    return 0
  }

  const interval = parseExpression(expressionRecherchee)

  return (
    interval.fields.second.length *
    interval.fields.minute.length *
    interval.fields.hour.length
  )
}
