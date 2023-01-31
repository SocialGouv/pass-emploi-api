import { Notification as _Notification } from './notification'
import { DateTime } from 'luxon'

export interface NotificationPoleEmploi {
  idExterneDE: string
  notifications: NotificationPoleEmploi.Notification[]
}

export namespace NotificationPoleEmploi {
  export interface Notification {
    idNotification: string
    codeNotification: string
    message: string
    typeMouvementRDV: _Notification.TypeRdv
    typeRDV: string
    dateCreation: DateTime
    idMetier?: string
  }
}
