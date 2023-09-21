import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Notification } from '../../domain/notification/notification'
import { HttpService } from '@nestjs/axios'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { firstValueFrom } from 'rxjs'
import { handleAxiosError } from './utils/axios-error-handler'

@Injectable()
export class MatomoClient {
  private readonly url: string
  private readonly siteId: string
  private readonly logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MatomoClient')
    this.url = this.configService.get('matomo').url
    this.siteId = this.configService.get('matomo').siteId
  }

  async trackEventPushNotificationEnvoyee(
    message: Notification.Message
  ): Promise<Result> {
    const categorieEvent = 'Push notifications sur mobile'
    const actionEvent = 'Envoi push notification'
    const nomEvent = message.data.type

    try {
      await firstValueFrom(
        this.httpService.post(this.url, null, {
          params: {
            idsite: this.siteId,
            rec: 1,
            e_c: categorieEvent,
            e_a: actionEvent,
            e_n: nomEvent
          }
        })
      )
      return emptySuccess()
    } catch (e) {
      return handleAxiosError(e, this.logger, 'Erreur POST Matomo')
    }
  }
}
