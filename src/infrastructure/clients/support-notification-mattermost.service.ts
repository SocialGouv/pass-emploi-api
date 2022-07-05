import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { SupportNotification } from '../../domain/support-notification'

@Injectable()
export class SupportNotificationMattermostService
  implements SupportNotification.Service
{
  constructor(
    private confiService: ConfigService,
    private httpService: HttpService
  ) {}

  async envoyerJobResultat(message: string): Promise<void> {
    const webhookUrl = this.confiService.get('mattermost.jobWebhookUrl')
    const payload = {
      text: message
    }
    await firstValueFrom(this.httpService.post(webhookUrl, payload))
  }
}
