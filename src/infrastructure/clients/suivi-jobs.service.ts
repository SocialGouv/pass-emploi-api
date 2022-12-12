import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import {
  RapportJob24h,
  ResultatJob,
  SuiviJob,
  SuiviJobs
} from '../../domain/suivi-jobs'
import {
  SuiviJobsDto,
  SuiviJobsSqlModel
} from '../sequelize/models/suivi-jobs.sql-model'
import { AsSql } from '../sequelize/types'

const BOT_USERNAME = 'CEJ Lama'

@Injectable()
export class SuiviJobsService implements SuiviJobs.Service {
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

    const payload = {
      username: BOT_USERNAME,
      text: construireRapport(rapportJobs)
    }
    await firstValueFrom(this.httpService.post(webhookUrl, payload))
  }

  async save(suiviJob: SuiviJob): Promise<void> {
    const dto: Omit<AsSql<SuiviJobsDto>, 'id'> = {
      jobType: suiviJob.jobType,
      dateExecution: suiviJob.dateExecution.toJSDate(),
      nbErreurs: suiviJob.nbErreurs,
      succes: suiviJob.succes,
      resultat: suiviJob.resultat,
      tempsExecution: suiviJob.tempsExecution
    }
    await SuiviJobsSqlModel.create(dto)
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
  const tableau = `| JOB | nbExecutionsAttendues | nbExecutions | nbErreurs | nbEchecs | dateExecution
    |:---------------------|:-----|:-----|:-----|:-----|:-----|
    ${rapportJobs.map(rapportJob =>
      Object.entries(rapportJob)
        .filter(entry => !isArrayOrObject(entry[1]))
        .map(entry => {
          return `| ${entry[1]} `
        })
        .join('|\n')
    )}`

  return `### Rapport quotidien des CRONs\n${tableau}`
}

function isArrayOrObject(entry: unknown): boolean {
  return typeof entry === 'object' || Array.isArray(entry)
}
