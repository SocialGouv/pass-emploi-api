import { DateTime } from 'luxon'

export const NotificationRepositoryToken = 'NotificationRepositoryToken'

export namespace Notification {
  export interface Repository {
    send(message: Notification.Message): Promise<void>
  }

  enum Type {
    NEW_ACTION = 'NEW_ACTION',
    NEW_RENDEZVOUS = 'NEW_RENDEZVOUS',
    DELETED_RENDEZVOUS = 'DELETED_RENDEZVOUS',
    NEW_MESSAGE = 'NEW_MESSAGE'
  }

  export interface Message {
    token: string
    notification: {
      title: string
      body: string
    }
    data: {
      type: string
      id?: string
    }
  }

  export function createNouvelleAction(
    token: string,
    idAction: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: 'Nouvelle action',
        body: 'Vous avez une nouvelle action'
      },
      data: {
        type: Type.NEW_ACTION,
        id: idAction
      }
    }
  }

  export function createNouveauRdv(
    token: string,
    idRdv: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: 'Nouveau RDV',
        body: 'Vous avez un nouveau RDV avec votre conseiller'
      },
      data: {
        type: Type.NEW_RENDEZVOUS,
        id: idRdv
      }
    }
  }

  export function createRdvSupprime(
    token: string,
    date: Date
  ): Notification.Message {
    const formattedDate = DateTime.fromJSDate(date).toFormat('dd/MM à HH:mm')
    return {
      token,
      notification: {
        title: 'RDV supprimé',
        body: `Votre rendez-vous du ${formattedDate} est supprimé`
      },
      data: {
        type: Type.DELETED_RENDEZVOUS
      }
    }
  }

  export function createNouveauMessage(token: string): Notification.Message {
    return {
      token,
      notification: {
        title: 'Nouveau message',
        body: 'Vous avez un nouveau message'
      },
      data: {
        type: Type.NEW_MESSAGE
      }
    }
  }
}
