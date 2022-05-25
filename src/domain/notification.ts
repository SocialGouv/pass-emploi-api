import { DateTime } from 'luxon'
import { DateService } from '../utils/date-service'
import { JeuneDuRendezVous } from './rendez-vous'

export const NotificationRepositoryToken = 'NotificationRepositoryToken'

export namespace Notification {
  export abstract class Service {
    async envoyerNotificationPush(
      jeune: JeuneDuRendezVous,
      data: { type: Notification.Type; id?: string; date?: Date }
    ): Promise<void> {
      const messagePush = creerContenuPush(
        data.type,
        jeune.pushNotificationToken!,
        data.id
      )
      this.envoyer(messagePush!)
    }
    abstract envoyer(message: Notification.Message): Promise<void>
  }

  export enum Type {
    NEW_ACTION = 'NEW_ACTION',
    NEW_RENDEZVOUS = 'NEW_RENDEZVOUS',
    UPDATED_RENDEZVOUS = 'UPDATED_RENDEZVOUS',
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

  function creerContenuPush(
    type: Notification.Type,
    token: string,
    id?: string,
    date?: Date
  ): Notification.Message | undefined {
    switch (type) {
      case Notification.Type.NEW_RENDEZVOUS: {
        return createNouveauRdv(token, id!)
      }
      case Notification.Type.DELETED_RENDEZVOUS: {
        return createRdvSupprime(token, date!)
      }
      case Notification.Type.UPDATED_RENDEZVOUS: {
        return createRendezVousMisAJour(token, id!)
      }
      default:
        return undefined
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

  export function createRendezVousMisAJour(
    token: string,
    idRdv: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: 'Rendez-vous modifié',
        body: 'Votre rendez-vous a été modifié'
      },
      data: {
        type: Type.UPDATED_RENDEZVOUS,
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
