import { Notification as _Notification } from './notification'
import { DateTime } from 'luxon'

export interface PoleEmploi {
  idExterneDE: string
  notifications: Array<{
    idNotification: string
    codeNotification: string
    message: string
    typeMouvementRDV: _Notification.TypeRdv
    typeRDV: string
    dateCreation: DateTime
    idMetier?: string
  }>
}
