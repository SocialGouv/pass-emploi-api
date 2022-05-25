import { Injectable } from '@nestjs/common'
import { Notification } from '../../domain/notification'
import { FirebaseClient } from '../clients/firebase-client'

@Injectable()
export class NotificationFirebaseRepository extends Notification.Service {
  constructor(private firebaseClient: FirebaseClient) {
    super()
  }

  async envoyer(message: Notification.Message): Promise<void> {
    this.firebaseClient.send(message)
  }
}
