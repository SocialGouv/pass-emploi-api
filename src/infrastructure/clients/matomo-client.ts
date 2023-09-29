import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import { firstValueFrom } from 'rxjs'
import { Notification } from '../../domain/notification/notification'
import { buildError } from '../../utils/logger.module'
import { getAPMInstance } from '../monitoring/apm.init'

@Injectable()
export class MatomoClient {
  private readonly url: string
  private readonly siteId: string
  private readonly isActive: boolean
  private readonly logger: Logger
  private apmService: APM.Agent

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MatomoClient')
    this.apmService = getAPMInstance()
    this.url = this.configService.get('matomo').url
    this.siteId = this.configService.get('matomo').siteId
    this.isActive = this.configService.get('features').envoyerStatsMatomo
  }

  async trackEventPushNotificationEnvoyee(
    message: Notification.Message
  ): Promise<void> {
    if (this.isActive) {
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
      } catch (e) {
        this.logger.error(buildError(`Erreur POST Matomo`, e))
        this.apmService.captureError(e)
      }
    }
  }
}
