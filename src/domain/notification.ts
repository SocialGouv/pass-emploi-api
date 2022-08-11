import { Inject, Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from '../utils/date-service'
import { Action } from './action/action'
import { Jeune } from './jeune/jeune'
import { Recherche } from './recherche'
import { RendezVous } from './rendez-vous'

export const NotificationRepositoryToken = 'NotificationRepositoryToken'

export namespace Notification {
  export interface Repository {
    send(message: Notification.Message): Promise<void>
  }

  export enum Type {
    NEW_ACTION = 'NEW_ACTION',
    NEW_RENDEZVOUS = 'NEW_RENDEZVOUS',
    RAPPEL_RENDEZVOUS = 'RAPPEL_RENDEZVOUS',
    DELETED_RENDEZVOUS = 'DELETED_RENDEZVOUS',
    UPDATED_RENDEZVOUS = 'UPDATED_RENDEZVOUS',
    NEW_MESSAGE = 'NEW_MESSAGE',
    NOUVELLE_OFFRE = 'NOUVELLE_OFFRE',
    DETAIL_ACTION = 'DETAIL_ACTION'
  }

  type TypeRdv =
    | Type.NEW_RENDEZVOUS
    | Type.DELETED_RENDEZVOUS
    | Type.UPDATED_RENDEZVOUS

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

  export function creerNotificationRappelRdv(
    token: string,
    idRdv: string,
    dateRdv: DateTime,
    dateService: DateService
  ): Notification.Message | undefined {
    const maintenant = dateService.now()
    const joursAvantRdv = dateRdv.diff(maintenant).as('day')

    const rdvPasse = joursAvantRdv < 0
    const rdvDansPlusDUnJour = joursAvantRdv > 2
    const rdvDansMoinsDUneSemaine = joursAvantRdv < 6

    if (rdvPasse) {
      return
    }

    let body = 'Vous avez un rendez-vous demain'

    if (rdvDansPlusDUnJour) {
      body = 'Vous avez un rendez-vous dans une semaine'
      if (rdvDansMoinsDUneSemaine) {
        return
      }
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

  export function creerNotificationRappelAction(
    token: string,
    idAction: string
  ): Notification.Message | undefined {
    return {
      token,
      notification: {
        title: 'Rappel action',
        body: 'Une action arrive à écheance dans 3 jours'
      },
      data: {
        type: Type.DETAIL_ACTION,
        id: idAction
      }
    }
  }

  @Injectable()
  export class Service {
    private logger: Logger

    constructor(
      @Inject(NotificationRepositoryToken)
      private notificationRepository: Notification.Repository
    ) {
      this.logger = new Logger('NotificationService')
    }

    private logMessageSucces(idJeune: string): void {
      this.logger.log(`Notification envoyée pour le jeune ${idJeune}`)
    }
    private logMessageEchec(idJeune: string): void {
      this.logger.log(
        `Le jeune ${idJeune} ne s'est jamais connecté sur l'application`
      )
    }

    async notifierLesJeunesDuRdv(
      rendezVous: RendezVous,
      typeNotification: TypeRdv
    ): Promise<void[]> {
      return Promise.all(
        rendezVous.jeunes.map(async jeune => {
          if (jeune.configuration?.pushNotificationToken) {
            let notification: Notification.Message | undefined

            switch (typeNotification) {
              case Type.NEW_RENDEZVOUS:
                notification = this.creerNotificationNouveauRdv(
                  jeune.configuration.pushNotificationToken,
                  rendezVous.id
                )
                break
              case Type.UPDATED_RENDEZVOUS:
                notification = this.creerNotificationRendezVousMisAJour(
                  jeune.configuration.pushNotificationToken,
                  rendezVous.id
                )
                break
              case Type.DELETED_RENDEZVOUS:
                notification = this.creerNotificationRdvSupprime(
                  jeune.configuration.pushNotificationToken,
                  rendezVous.date
                )
                break
            }
            if (notification) {
              return this.notificationRepository.send(notification)
            }
          } else {
            this.logMessageEchec(jeune.id)
          }
        })
      )
    }

    async notifierLesJeunesDuNouveauMessage(jeunes: Jeune[]): Promise<void[]> {
      return Promise.all(
        jeunes.map(async jeune => {
          if (jeune.configuration?.pushNotificationToken) {
            const notification = this.creerNotificationNouveauMessage(
              jeune.configuration?.pushNotificationToken
            )
            const promise = this.notificationRepository.send(notification)
            this.logMessageSucces(jeune.id)
            return promise
          } else {
            this.logMessageEchec(jeune.id)
          }
        })
      )
    }

    async notifierNouvelleAction(jeune: Jeune, action: Action): Promise<void> {
      if (jeune.configuration?.pushNotificationToken) {
        const notification = this.creerNotificationNouvelleAction(
          jeune.configuration?.pushNotificationToken,
          action.id
        )
        const promise = this.notificationRepository.send(notification)
        this.logMessageSucces(jeune.id)
        return promise
      } else {
        this.logMessageEchec(jeune.id)
      }
    }

    async notifierNouveauCommentaireAction(
      idAction: Action.Id,
      configurationApplication?: Jeune.ConfigurationApplication
    ): Promise<void> {
      if (configurationApplication) {
        if (configurationApplication.pushNotificationToken) {
          const notification = this.creerNotificationNouveauCommentaire(
            configurationApplication.pushNotificationToken,
            idAction
          )
          const promise = this.notificationRepository.send(notification)
          this.logMessageSucces(configurationApplication.idJeune)
          return promise
        } else {
          this.logMessageEchec(configurationApplication.idJeune)
        }
      }
    }

    async notifierNouvellesOffres(
      recherche: Recherche,
      configurationApplication?: Jeune.ConfigurationApplication
    ): Promise<void> {
      if (configurationApplication) {
        if (configurationApplication.pushNotificationToken) {
          const notification = this.creerNotificationNouvelleOffre(
            configurationApplication.pushNotificationToken,
            recherche.id,
            recherche.titre
          )
          const promise = this.notificationRepository.send(notification)
          this.logMessageSucces(configurationApplication.idJeune)
          return promise
        } else {
          this.logMessageEchec(configurationApplication.idJeune)
        }
      }
    }

    private creerNotificationNouvelleAction(
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
    private creerNotificationNouvelleOffre(
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
    private creerNotificationNouveauRdv(
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
    // TODO: Envoyer un type de notification UPDATE et gérer les versions de l'app
    private creerNotificationRendezVousMisAJour(
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
          type: Type.NEW_RENDEZVOUS,
          id: idRdv
        }
      }
    }
    private creerNotificationRdvSupprime(
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
    private creerNotificationNouveauMessage(
      token: string
    ): Notification.Message {
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
    private creerNotificationNouveauCommentaire(
      token: string,
      idAction: string
    ): Notification.Message {
      return {
        token,
        notification: {
          title: 'Action mise à jour',
          body: 'Un commentaire a été ajouté par votre conseiller'
        },
        data: {
          type: Type.DETAIL_ACTION,
          id: idAction
        }
      }
    }
  }
}
