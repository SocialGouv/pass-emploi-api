import { Injectable } from '@nestjs/common'
import { Notification } from '../../domain/notification/notification'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { FirebaseClient } from '../clients/firebase-client'
import { MatomoClient } from '../clients/matomo-client'
import {
  NotificationJeuneDto,
  NotificationJeuneSqlModel
} from '../sequelize/models/notification-jeune.sql-model'
import { AsSql } from '../sequelize/types'

@Injectable()
export class NotificationFirebaseSqlRepository
  implements Notification.Repository
{
  constructor(
    private firebaseClient: FirebaseClient,
    private matomoClient: MatomoClient,
    private idService: IdService,
    private dateService: DateService
  ) {}

  async send(
    message: Notification.Message,
    idJeune?: string,
    pushNotification?: boolean
  ): Promise<void> {
    if (pushNotification === true) {
      this.firebaseClient.send(message)
      this.matomoClient.trackEventPushNotificationEnvoyee(message)
    }
    if (idJeune) {
      const notifSql: AsSql<NotificationJeuneDto> = {
        id: this.idService.uuid(),
        idJeune,
        dateNotif: this.dateService.now().toJSDate(),
        type: message.data.type,
        titre: message.notification.title,
        description: message.notification.body,
        idObjet: message.data.id || null
      }
      NotificationJeuneSqlModel.create(notifSql).catch(_e => {})
    }
  }
}
