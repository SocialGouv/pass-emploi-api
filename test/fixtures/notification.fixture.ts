import { Notification } from '../../src/domain/notification/notification'
import { DateTime } from 'luxon'
import { v4 as uuidV4 } from 'uuid'

export const uneNotification = (
  args: Partial<Notification.Message> = {}
): Notification.Message => {
  const defaults = {
    token: 'token',
    notification: {
      title: 'Nouveau message',
      body: 'Vous avez un nouveau message'
    },
    data: {
      type: Notification.Type.NEW_MESSAGE
    }
  }

  return { ...defaults, ...args }
}

export const desNotificationsDunJeunePoleEmploi = (
  args: Partial<Notification.PoleEmploi> = {}
): Notification.PoleEmploi => {
  const defaults: Notification.PoleEmploi = {
    idExterneDE: 'string',
    notifications: [
      {
        message: 'Un nouveau rendez-vous est positionn√© au 18/08/2022 16:30.',
        typeRDV: 'PRESTATIONS',
        idMetier: '92dc7deb-3580-4e5c-af1c-23e9af0ecd07',
        dateCreation: DateTime.fromISO('2022-08-12T13:58:50+02:00'),
        idNotification: 'b1d84a42ba884b35881e118132825992',
        codeNotification: 'INSC_RDV_PRESTA',
        typeMouvementRDV: Notification.Type.NEW_RENDEZVOUS
      }
    ]
  }

  return { ...defaults, ...args }
}

export const uneNotificationPoleEmploi = (
  args: Partial<Notification.PoleEmploi.Notification> = {}
): Notification.PoleEmploi.Notification => {
  const defaults: Notification.PoleEmploi.Notification = {
    message: 'Un nouveau rendez-vous est positionné au 18/08/2022 16:30.',
    typeRDV: 'PRESTATIONS',
    idMetier: '92dc7deb-3580-4e5c-af1c-23e9af0ecd07',
    dateCreation: DateTime.fromISO('2022-08-12T13:58:50+02:00'),
    idNotification: uuidV4(),
    codeNotification: 'INSC_RDV_PRESTA',
    typeMouvementRDV: Notification.Type.NEW_RENDEZVOUS
  }

  return { ...defaults, ...args }
}
