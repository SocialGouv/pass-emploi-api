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

  createContenuPushNouveauRdv(
    token: string,
    idRdv: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: 'Nouveau rendez-vous',
        body: 'Votre conseiller a programmé un nouveau rendez-vous'
      },
      data: {
        type: Notification.Type.NEW_RENDEZVOUS,
        id: idRdv
      }
    }
  }
}
