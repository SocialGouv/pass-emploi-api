import { DateTime } from 'luxon'
import { DateService } from '../utils/date-service'

export const NotificationRepositoryToken = 'NotificationRepositoryToken'

export namespace Notification {
  export interface Repository {
    send(message: Notification.Message): Promise<void>
  }

  enum Type {
    NEW_ACTION = 'NEW_ACTION',
    NEW_RENDEZVOUS = 'NEW_RENDEZVOUS',
    RAPPEL_RENDEZVOUS = 'RAPPEL_RENDEZVOUS',
    DELETED_RENDEZVOUS = 'DELETED_RENDEZVOUS',
    NEW_MESSAGE = 'NEW_MESSAGE',
    NOUVELLE_OFFRE = 'NOUVELLE_OFFRE'
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

  export function createNouvelleOffre(
    token: string,
    idRecherche: string,
    titre: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: titre,
        body: 'De nouveaux résultats sont disponibles'
      },
      data: {
        type: Type.NOUVELLE_OFFRE,
        id: idRecherche
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
        title: 'Nouveau rendez-vous',
        body: 'Votre conseiller a programmé un nouveau rendez-vous'
      },
      data: {
        type: Type.NEW_RENDEZVOUS,
        id: idRdv
      }
    }
  }

  export function createRappelRdv(
    token: string,
    idRdv: string,
    date: DateTime,
    dateService: DateService
  ): Notification.Message {
    const today = dateService.now()
    let body = 'Vous avez un rendez-vous demain'
    if (date.diff(today).as('day') > 2) {
      body = 'Vous avez un rendez-vous dans une semaine'
    }
    return {
      token,
      notification: {
        title: 'Rappel rendez-vous',
        body
      },
      data: {
        type: Type.RAPPEL_RENDEZVOUS,
        id: idRdv
      }
    }
  }

  export function createRdvSupprime(
    token: string,
    date: Date
  ): Notification.Message {
    const formattedDate = DateTime.fromJSDate(date).toFormat('dd/MM')
    return {
      token,
      notification: {
        title: 'Rendez-vous supprimé',
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
