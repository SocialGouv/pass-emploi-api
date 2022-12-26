import { Inject, Injectable } from '@nestjs/common'
import { parseExpression } from 'cron-parser'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { Job } from '../../../building-blocks/types/job'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { listeCronJobs, Planificateur } from '../../../domain/planificateur'
import {
  RapportJob24h,
  SuiviJob,
  SuiviJobServiceToken
} from '../../../domain/suivi-job'
import { SuiviJobSqlModel } from '../../../infrastructure/sequelize/models/suivi-job.sql-model'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class MonitorJobsCommandHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.MONITORER_JOBS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    const ilYa24h = maintenant.minus({ hours: 24 })

    const rapportJobs: RapportJob24h[] = []

    for (const cron of listeCronJobs) {
      const suiviDernieres24hSql = await SuiviJobSqlModel.findAll({
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

    await this.suiviJobService.envoyerRapport(rapportJobs)

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {}
    }
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
