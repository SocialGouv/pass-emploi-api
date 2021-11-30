import { Injectable } from '@nestjs/common'
import { Notification } from '../../domain/notification'
import { FirebaseClient } from '../clients/firebase-client'

@Injectable()
export class NotificationFirebaseRepository implements Notification.Repository {
  constructor(private firebaseClient: FirebaseClient) {}

  async send(message: Notification.Message): Promise<void> {
    await this.firebaseClient.send(message)
  }
}
