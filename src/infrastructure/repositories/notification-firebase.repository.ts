import { Injectable } from '@nestjs/common'
import { Notification } from '../../domain/notification'
import { FirebaseClient } from '../clients/firebase-client'

@Injectable()
export class NotificationFirebaseRepository extends Notification.Service {
  private configTemplates: Map<
    Notification.Type,
    { title: string; body: string }
  >

  constructor(private firebaseClient: FirebaseClient) {
    super()
    this.configTemplates = new Map<
      Notification.Type,
      { title: string; body: string }
    >([
      [
        Notification.Type.NEW_RENDEZVOUS,
        {
          title: 'Nouveau rendez-vous',
          body: 'Votre conseiller a programmé un nouveau rendez-vous'
        }
      ]
    ])
  }

  async envoyer(message: Notification.Message): Promise<void> {
    this.firebaseClient.send(message)
  }

  creerContenuPush(
    typeNotification: Notification.Type,
    pushNotificationToken: string,
    idRendezVous: string
  ): Notification.Message {
    const template = this.configTemplates.get(typeNotification)
    return {
      token: pushNotificationToken,
      notification: {
        title: template!.title,
        body: template!.body
      },
      data: {
        type: typeNotification,
        id: idRendezVous
      }
    }
  }
}
