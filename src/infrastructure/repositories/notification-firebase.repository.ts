import { Injectable } from '@nestjs/common'
import { Notification } from '../../domain/notification/notification'
import { FirebaseClient } from '../clients/firebase-client'
import { MatomoClient } from '../clients/matomo-client'

@Injectable()
export class NotificationFirebaseRepository implements Notification.Repository {
  constructor(
    private firebaseClient: FirebaseClient,
    private matomoClient: MatomoClient
  ) {}

  async send(message: Notification.Message): Promise<void> {
    this.firebaseClient.send(message)
    this.matomoClient.trackEventPushNotificationEnvoyee(message)
  }
}
