import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { RapportJob24h, ResultatJob, SuiviJob } from '../../domain/suivi-job'
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

  async notifierResultatJob(resultatJob: ResultatJob): Promise<void> {
    const webhookUrl = this.configService.get('mattermost.jobWebhookUrl')

    const payload = {
      username: BOT_USERNAME,
      text: construireMessage(resultatJob)
    }
    await firstValueFrom(this.httpService.post(webhookUrl, payload))
  }

  async envoyerRapport(rapportJobs: RapportJob24h[]): Promise<void> {
    const webhookUrl = this.configService.get('mattermost.jobWebhookUrl')

    if (rapportJobs.length) {
      const payload = {
        username: BOT_USERNAME,
        text: construireRapport(rapportJobs)
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

function construireMessage(resultatJob: ResultatJob): string {
  let tableau = ''

  if (isSuccess(resultatJob.result)) {
    tableau = `| Statut | :white_check_mark: |
    |:------------------------|:-------------|
    ${Object.entries(resultatJob.result.data!)
      .filter(entry => !isArrayOrObject(entry[1]))
      .map(entry => {
        return `| ${entry[0]} | ${entry[1]} |`
      })
      .join('\n')}`
  } else if (isFailure(resultatJob.result)) {
    tableau = `| Statut | :x: |
    |:------------------|:----|
    ${Object.entries(resultatJob.result.error)
      .filter(entry => !isArrayOrObject(entry[1]))
      .map(entry => {
        return `| ${entry[0]} | ${entry[1]} |`
      })
      .join('\n')}`
  }

  return `### Résultat du job _${resultatJob.jobCommand}_\n${tableau}`
}

function construireRapport(rapportJobs: RapportJob24h[]): string {
  const headers = Object.keys(rapportJobs[0])
    .map(header => header)
    .join('|')
  const separator = Object.keys(rapportJobs[0])
    .map(_h => ':---')
    .join('|')
  const data = rapportJobs
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
