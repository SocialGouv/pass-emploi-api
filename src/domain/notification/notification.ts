import { Inject, Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { SessionMiloAllegeeForBeneficiaire } from 'src/domain/milo/session.milo'
import { DateService } from '../../utils/date-service'
import { Action } from '../action/action'
import { Core, beneficiaireEstFTConnect, estMilo } from '../core'
import { Jeune } from '../jeune/jeune'
import { Recherche } from '../offre/recherche/recherche'
import { RendezVous } from '../rendez-vous/rendez-vous'
import * as _PoleEmploi from './notification.pole-emploi'

export const NotificationRepositoryToken = 'NotificationRepositoryToken'

export namespace Notification {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import PoleEmploi = _PoleEmploi.NotificationPoleEmploi

  export interface Repository {
    send(message: Notification.Message, idJeune?: string): Promise<void>
  }

  export enum Type {
    NEW_ACTION = 'NEW_ACTION',
    NEW_RENDEZVOUS = 'NEW_RENDEZVOUS',
    RAPPEL_RENDEZVOUS = 'RAPPEL_RENDEZVOUS',
    DELETED_RENDEZVOUS = 'DELETED_RENDEZVOUS',
    UPDATED_RENDEZVOUS = 'UPDATED_RENDEZVOUS',
    NEW_MESSAGE = 'NEW_MESSAGE',
    NOUVELLE_OFFRE = 'NOUVELLE_OFFRE',
    DETAIL_ACTION = 'DETAIL_ACTION',
    DETAIL_SESSION_MILO = 'DETAIL_SESSION_MILO',
    DELETED_SESSION_MILO = 'DELETED_SESSION_MILO',
    RAPPEL_CREATION_ACTION = 'RAPPEL_CREATION_ACTION',
    RAPPEL_CREATION_DEMARCHE = 'RAPPEL_CREATION_DEMARCHE',
    OUTILS = 'OUTILS'
  }

  export type TypeRdv =
    | Type.NEW_RENDEZVOUS
    | Type.DELETED_RENDEZVOUS
    | Type.UPDATED_RENDEZVOUS

  export type TypeSession = Type.DETAIL_SESSION_MILO | Type.DELETED_SESSION_MILO

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

  export function creerNotificationRappelSessionMilo(
    token: string,
    idSession: string,
    date: DateTime,
    dateService: DateService
  ): Notification.Message | undefined {
    const maintenant = dateService.now()
    const joursAvantRdv = date.diff(maintenant).as('day')

    const sessionPassee = joursAvantRdv < 0
    const sessionDansPlusDUneSemaine = joursAvantRdv > 7

    const sessionDansPlusDUnJour = joursAvantRdv > 2
    const sessionDansMoinsDUneSemaine = joursAvantRdv < 6

    if (sessionPassee || sessionDansPlusDUneSemaine) {
      return
    }

    let body = 'Vous avez une session demain'

    if (sessionDansPlusDUnJour) {
      body = 'Vous avez une session dans une semaine'
      if (sessionDansMoinsDUneSemaine) {
        return
      }
    }

    return {
      token,
      notification: {
        title: 'Rappel session',
        body
      },
      data: {
        type: Type.DETAIL_SESSION_MILO,
        id: idSession
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
        body: 'Une action arrive à échéance dans 3 jours'
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
      private notificationRepository: Notification.Repository,
      private dateService: DateService
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
          if (
            jeune.configuration.pushNotificationToken &&
            jeune.preferences.rendezVousSessions
          ) {
            const notification = this.creerNotificationRendezVous(
              typeNotification,
              rendezVous,
              jeune.configuration.pushNotificationToken
            )
            if (notification) {
              return this.notificationRepository.send(notification, jeune.id)
            }
          } else {
            this.logMessageEchec(jeune.id)
          }
        })
      )
    }

    private creerNotificationRendezVous(
      typeNotification: Notification.Type,
      rendezVous: RendezVous,
      token: string
    ): Notification.Message | undefined {
      let notification: Notification.Message | undefined

      switch (typeNotification) {
        case Type.NEW_RENDEZVOUS:
          notification = this.creerNotificationNouveauRdv(token, rendezVous.id)
          break
        case Type.UPDATED_RENDEZVOUS:
          notification = this.creerNotificationRendezVousMisAJour(
            token,
            rendezVous.id
          )
          break
        case Type.DELETED_RENDEZVOUS:
          notification = this.creerNotificationRdvSupprime(
            token,
            rendezVous.date
          )
          break
      }

      return notification
    }

    public notifierUnRendezVousPoleEmploi(
      typeNotification: Notification.Type,
      token: string,
      message: string,
      idJeune: string,
      idRendezVous?: string
    ): void {
      // filtrage de l'existance du push notif token et des preferences de notification est fait en amont
      let notification: Notification.Message | undefined

      switch (typeNotification) {
        case Type.NEW_RENDEZVOUS:
          notification = this.creerNotificationNouveauRdv(
            token,
            idRendezVous!,
            message
          )
          break
        case Type.UPDATED_RENDEZVOUS:
          notification = this.creerNotificationRendezVousMisAJour(
            token,
            idRendezVous!,
            message
          )
          break
        case Type.DELETED_RENDEZVOUS:
          notification = this.creerNotificationRdvSupprimePoleEmploi(
            token,
            message
          )
          break
      }

      if (notification) {
        this.notificationRepository.send(notification, idJeune)
      }
    }

    async notifierLesJeunesDuNouveauMessage(jeunes: Jeune[]): Promise<void[]> {
      return Promise.all(
        jeunes.map(async jeune => {
          if (
            jeune.configuration.pushNotificationToken &&
            jeune.preferences.messages
          ) {
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

    async notifierRappelCreationActionDemarche(
      id: string,
      structure: Core.Structure,
      token: string,
      nbActionsCreees: number,
      peutVoirLeComptageDesHeures?: boolean
    ): Promise<void> {
      try {
        let notification: Notification.Message | undefined

        if (
          estMilo(structure) &&
          peutVoirLeComptageDesHeures &&
          nbActionsCreees > 0
        ) {
          notification = {
            token,
            notification: {
              title: 'On est jeudi ! 🥳',
              body: 'Continuez à saisir vos actions de la semaine'
            },
            data: {
              type: Type.RAPPEL_CREATION_ACTION
            }
          }
        } else if (nbActionsCreees == 0) {
          notification = creerNotificationRappelCreationActionDemarche(
            token,
            structure,
            this.dateService
          )
        }
        if (notification) {
          const promise = this.notificationRepository.send(notification, id)
          this.logMessageSucces(id)
          return promise
        }
      } catch (e) {
        this.logger.error(e)
        this.logMessageEchec(id)
      }
    }

    async notifier0Heures(id: string, token: string): Promise<void> {
      try {
        const notification = {
          token,
          notification: {
            title: 'Vous avez 2 minutes ? 👀',
            body: 'Commencez à renseigner vos actions'
          },
          data: {
            type: Type.RAPPEL_CREATION_ACTION
          }
        }
        const promise = this.notificationRepository.send(notification, id)
        this.logMessageSucces(id)
        return promise
      } catch (e) {
        this.logger.error(e)
        this.logMessageEchec(id)
      }
    }

    async notifierNouvelleAction(jeune: Jeune, action: Action): Promise<void> {
      if (
        jeune.configuration.pushNotificationToken &&
        jeune.preferences.creationActionConseiller
      ) {
        const notification = this.creerNotificationNouvelleAction(
          jeune.configuration?.pushNotificationToken,
          action.id
        )
        const promise = this.notificationRepository.send(notification, jeune.id)
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
          const notification = creerNotificationNouveauCommentaire(
            configurationApplication.pushNotificationToken,
            idAction
          )
          const promise = this.notificationRepository.send(
            notification,
            configurationApplication.idJeune
          )
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
        if (
          configurationApplication.pushNotificationToken &&
          configurationApplication.preferences?.alertesOffres
        ) {
          const notification = this.creerNotificationNouvelleOffre(
            configurationApplication.pushNotificationToken,
            recherche.id,
            recherche.titre
          )
          const promise = this.notificationRepository.send(
            notification,
            configurationApplication.idJeune
          )
          this.logMessageSucces(configurationApplication.idJeune)
          return promise
        } else {
          this.logMessageEchec(configurationApplication.idJeune)
        }
      }
    }

    async notifierInscriptionSession(
      idSsession: string,
      jeunes: Jeune[]
    ): Promise<void[]> {
      return Promise.all(
        jeunes.map(async jeune => {
          if (
            jeune.configuration.pushNotificationToken &&
            jeune.preferences.rendezVousSessions
          ) {
            const notification = creerNotificationInscriptionSession(
              jeune.configuration.pushNotificationToken,
              idSsession
            )
            if (notification) {
              return this.notificationRepository.send(notification, jeune.id)
            }
          } else {
            this.logMessageEchec(jeune.id)
          }
        })
      )
    }

    async notifierAutoinscriptionSession(
      session: SessionMiloAllegeeForBeneficiaire,
      jeune: Jeune
    ): Promise<void> {
      if (
        jeune.configuration.pushNotificationToken &&
        jeune.preferences.rendezVousSessions
      ) {
        const notification = creerNotificationAutoinscriptionSession(
          jeune.configuration.pushNotificationToken,
          session
        )
        if (notification) {
          return this.notificationRepository.send(notification, jeune.id)
        }
      } else {
        this.logMessageEchec(jeune.id)
      }
    }

    async notifierModificationSession(
      idSsession: string,
      jeunes: Jeune[]
    ): Promise<void[]> {
      return Promise.all(
        jeunes.map(async jeune => {
          if (
            jeune.configuration.pushNotificationToken &&
            jeune.preferences.rendezVousSessions
          ) {
            const notification = creerNotificationModificationSession(
              jeune.configuration?.pushNotificationToken,
              idSsession
            )
            if (notification) {
              return this.notificationRepository.send(notification, jeune.id)
            }
          } else {
            this.logMessageEchec(jeune.id)
          }
        })
      )
    }

    async notifierDesinscriptionSession(
      idSsession: string,
      dateSession: DateTime,
      jeunes: Jeune[]
    ): Promise<void[]> {
      return Promise.all(
        jeunes.map(async jeune => {
          if (
            jeune.configuration.pushNotificationToken &&
            jeune.preferences.rendezVousSessions
          ) {
            const notification = creerNotificationDesinscriptionSession(
              jeune.configuration?.pushNotificationToken,
              idSsession,
              dateSession
            )
            if (notification) {
              return this.notificationRepository.send(notification, jeune.id)
            }
          } else {
            this.logMessageEchec(jeune.id)
          }
        })
      )
    }

    async notifierBeneficiaires(
      id: string,
      token: string,
      title: string,
      body: string
    ): Promise<void> {
      try {
        const notification = {
          token,
          notification: {
            title: title,
            body: body
          },
          data: {
            type: Type.OUTILS
          }
        }
        const promise = this.notificationRepository.send(notification, id)
        this.logMessageSucces(id)
        return promise
      } catch (e) {
        this.logger.error(e)
        this.logMessageEchec(id)
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
      idRdv: string,
      message?: string
    ): Notification.Message {
      return {
        token,
        notification: {
          title: 'Nouveau rendez-vous',
          body: message ?? 'Votre conseiller a programmé un nouveau rendez-vous'
        },
        data: {
          type: Type.NEW_RENDEZVOUS,
          id: idRdv
        }
      }
    }

    private creerNotificationRendezVousMisAJour(
      token: string,
      idRdv: string,
      message?: string
    ): Notification.Message {
      return {
        token,
        notification: {
          title: 'Rendez-vous modifié',
          body: message ?? 'Votre rendez-vous a été modifié'
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

    private creerNotificationRdvSupprimePoleEmploi(
      token: string,
      message: string
    ): Notification.Message {
      return {
        token,
        notification: {
          title: 'Rendez-vous supprimé',
          body: message
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
  }

  function getBodyNotificationRappelCreationActionDemarche(
    structure: Core.Structure,
    dateService: DateService
  ): { title: string; body: string } {
    const trucs = beneficiaireEstFTConnect(structure) ? 'démarches' : 'actions'
    const messages: Array<{ title: string; body: string }> = [
      {
        title: `Le saviez-vous ?`,
        body: `Vous pouvez renseigner vos ${trucs} sur l’application`
      },
      {
        title: `Comment s’est passée votre semaine ?`,
        body: `Prenez 5 min pour renseigner vos ${trucs}`
      },
      {
        title: `Plus que qu’un jour avant le week-end !`,
        body: `Prenez 5 minutes pour renseigner vos ${trucs}`
      },
      {
        title: `Le conseil du jeudi 😏`,
        body: `C’est le moment de renseigner vos ${trucs} de la semaine`
      }
    ]
    const now = dateService.now()
    return messages[now.weekNumber % messages.length]
  }

  function creerNotificationRappelCreationActionDemarche(
    token: string,
    structure: Core.Structure,
    dateService: DateService
  ): Notification.Message {
    return {
      token,
      notification: getBodyNotificationRappelCreationActionDemarche(
        structure,
        dateService
      ),
      data: {
        type: beneficiaireEstFTConnect(structure)
          ? Type.RAPPEL_CREATION_DEMARCHE
          : Type.RAPPEL_CREATION_ACTION
      }
    }
  }

  function creerNotificationNouveauCommentaire(
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

  function creerNotificationInscriptionSession(
    token: string,
    idSession: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: 'Nouveau rendez-vous',
        body: 'Votre conseiller a programmé un nouveau rendez-vous'
      },
      data: {
        type: Type.DETAIL_SESSION_MILO,
        id: idSession
      }
    }
  }

  function creerNotificationAutoinscriptionSession(
    token: string,
    session: SessionMiloAllegeeForBeneficiaire
  ): Notification.Message {
    const date = session.debut.toFormat("dd/MM/yyyy à HH'h'mm")

    return {
      token,
      notification: {
        title: 'Inscription confirmée',
        body: `Votre inscription à l’événement ${session.nom} le ${date} a bien été prise en compte.`
      },
      data: {
        type: Type.DETAIL_SESSION_MILO,
        id: session.id
      }
    }
  }

  function creerNotificationModificationSession(
    token: string,
    idSession: string
  ): Notification.Message {
    return {
      token,
      notification: {
        title: 'Rendez-vous modifié',
        body: 'Votre rendez-vous a été modifié'
      },
      data: {
        type: Type.DETAIL_SESSION_MILO,
        id: idSession
      }
    }
  }

  function creerNotificationDesinscriptionSession(
    token: string,
    idSession: string,
    date: DateTime
  ): Notification.Message {
    const formattedDate = date.toFormat('dd/MM')
    return {
      token,
      notification: {
        title: 'Rendez-vous supprimé',
        body: `Votre rendez-vous du ${formattedDate} est supprimé`
      },
      data: {
        type: Type.DELETED_SESSION_MILO,
        id: idSession
      }
    }
  }
}
