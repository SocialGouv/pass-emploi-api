import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { isFailure, isSuccess } from 'src/building-blocks/types/result'
import {
  NotificationSupport,
  InfosJob
} from '../../domain/notification-support'

const BOT_USERNAME = 'CEJ Lama'

@Injectable()
export class NotificationSupportMattermostService
  implements NotificationSupport.Service
{
  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  async notifierResultatJob(infosJob: InfosJob): Promise<void> {
    const webhookUrl = this.configService.get('mattermost.jobWebhookUrl')

    const payload = {
      username: BOT_USERNAME,
      text: construireMessage(infosJob)
    }
    await firstValueFrom(this.httpService.post(webhookUrl, payload))
  }
}

function construireMessage(infosJob: InfosJob): string {
  let tableau = ''

  if (isSuccess(infosJob.result)) {
    tableau = `| Statut | :white_check_mark: |
    |:------------------------|:-------------|
    ${Object.entries(infosJob.result.data!)
      .filter(entry => !isArrayOrObject(entry[1]))
      .map(entry => {
        return `| ${entry[0]} | ${entry[1]} |`
      })
      .join('\n')}`
  } else if (isFailure(infosJob.result)) {
    tableau = `| Statut | :x: |
    |:------------------|:----|
    ${Object.entries(infosJob.result.error)
      .filter(entry => !isArrayOrObject(entry[1]))
      .map(entry => {
        return `| ${entry[0]} | ${entry[1]} |`
      })
      .join('\n')}`
  }

  return `### Résultat du job _${infosJob.job}_\n${tableau}`
}

function isArrayOrObject(entry: unknown): boolean {
  return typeof entry === 'object' || Array.isArray(entry)
}
