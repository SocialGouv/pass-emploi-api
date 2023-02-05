import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { RapportJob24h, SuiviJob } from '../../domain/suivi-job'
import {
  SuiviJobDto,
  SuiviJobSqlModel
} from '../sequelize/models/suivi-job.sql-model'
import { AsSql } from '../sequelize/types'

const BOT_USERNAME = 'CEJ Lama'

@Injectable()
export class SuiviJobService implements SuiviJob.Service {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  async notifierResultatJob(suiviJob: SuiviJob): Promise<void> {
    const webhookUrl = this.configService.get('mattermost.jobWebhookUrl')

    const payload = {
      username: BOT_USERNAME,
      text: construireMessage(suiviJob)
    }
    await firstValueFrom(this.httpService.post(webhookUrl, payload))

    const messageDErreur = suiviJob.erreur?.stack ?? suiviJob.erreur?.message
    if (messageDErreur) {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          username: BOT_USERNAME,
          text: '```\n' + messageDErreur + '\n```'
        })
      )
    }
  }

  async envoyerRapport(rapportJobs: RapportJob24h[]): Promise<void> {
    const webhookUrl = this.configService.get('mattermost.jobWebhookUrl')
    const logsUrl = this.configService.get('monitoring').dashboardUrl

    if (rapportJobs.length) {
      const payload = {
        username: BOT_USERNAME,
        text: construireRapport(rapportJobs, logsUrl)
      }
      await firstValueFrom(this.httpService.post(webhookUrl, payload))
    }
  }

  async save(suiviJob: SuiviJob): Promise<void> {
    const dto: Omit<AsSql<SuiviJobDto>, 'id'> = {
      jobType: suiviJob.jobType,
      dateExecution: suiviJob.dateExecution.toJSDate(),
      nbErreurs: suiviJob.nbErreurs,
      succes: suiviJob.succes,
      resultat: suiviJob.resultat,
      tempsExecution: suiviJob.tempsExecution
    }
    await SuiviJobSqlModel.create(dto)
  }
}

function construireMessage(suiviJob: SuiviJob): string {
  const suiviJobStringified = {
    ...suiviJob,
    dateExecution: suiviJob.dateExecution.setZone('Europe/Paris').toISO()
  }
  delete suiviJobStringified.erreur
  const data = [
    ...Object.entries(suiviJobStringified).filter(
      entry => !isArrayOrObject(entry[1])
    ),
    ...Object.entries(suiviJob.resultat as ArrayLike<unknown>)
  ]
  const statutIcon = suiviJob.succes ? ':white_check_mark:' : ':x:'

  const tableau = `| Statut | ${statutIcon} |
    |:------------------------|:------------|
    ${data
      .map(entry => {
        return `| ${entry[0]} | ${entry[1]} |`
      })
      .join('\n')}`

  return `### Résultat du job _${suiviJob.jobType}_\n${tableau}`
}

function construireRapport(
  rapportJobs: RapportJob24h[],
  logsUrl: string
): string {
  const rapportJobsStringified = rapportJobs.map(rapportJob => ({
    aBienTourne:
      rapportJob.nbExecutionsAttendues !== rapportJob.nbExecutions
        ? ':x:'
        : ':white_check_mark:',
    pasEnEchec: rapportJob.nbEchecs > 0 ? ':x:' : ':white_check_mark:',
    ...rapportJob,
    logs: `[lien](${logsUrl}/app/discover#/?_g=(time:(from:now-24h%2Fh,to:now))&_a=(query:(language:kuery,query:"${rapportJob.jobType}")))`
  }))
  const headers = Object.keys(rapportJobsStringified[0])
    .map(header => header)
    .join('|')
  const separator = Object.keys(rapportJobsStringified[0])
    .map(_h => ':---')
    .join('|')
  const data = rapportJobsStringified
    .map(job =>
      Object.values(job)
        .map(v => {
          return `|${Array.isArray(v) ? v.join(', ') : v}`
        })
        .join('')
    )
    .join('|\n')

  return `### Rapport quotidien des CRONs\n|${headers}\n|${separator}\n${data}|`
}

function isArrayOrObject(entry: unknown): boolean {
  return typeof entry === 'object' || Array.isArray(entry)
}
