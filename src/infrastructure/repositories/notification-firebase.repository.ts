import { Injectable } from '@nestjs/common'
import { Notification } from '../../domain/notification/notification'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { FirebaseClient } from '../clients/firebase-client'
import { MatomoClient } from '../clients/matomo-client'
import { NotificationJeuneSqlModel } from '../sequelize/models/notification-jeune.sql-model'

@Injectable()
export class NotificationFirebaseRepository implements Notification.Repository {
  constructor(
    private firebaseClient: FirebaseClient,
    private matomoClient: MatomoClient,
    private idService: IdService,
    private dateService: DateService
  ) {}

  async send(message: Notification.Message, idJeune: string): Promise<void> {
    this.firebaseClient.send(message)
    this.matomoClient.trackEventPushNotificationEnvoyee(message)
    NotificationJeuneSqlModel.create({
      id: this.idService.uuid(),
      idJeune,
      date: this.dateService.now().toJSDate(),
      type: message.data.type,
      title: message.notification.title,
      description: message.notification.body
    })
  }
}
