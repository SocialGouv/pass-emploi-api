import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { DateService } from '../../utils/date-service'
import { Notification } from '../../domain/notification/notification'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { Jeune, JeunePoleEmploiRepositoryToken } from '../../domain/jeune/jeune'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Job } from '../../building-blocks/types/job'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import Type = Notification.Type

const NOMBRE_JEUNES_EN_PARALLELE = 100

@Injectable()
@ProcessJobType(Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE)
export class NotifierRendezVousPEJobHandler extends JobHandler<Job> {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private notificationService: Notification.Service,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(JeunePoleEmploiRepositoryToken)
    private jeunePoleEmploiRepository: Jeune.PoleEmploi.Repository
  ) {
    super(Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    const aujourdhui = maintenant.toISODate()
    const hier = maintenant.minus({ days: 1 }).toISODate()

    const stats: Stats = {
      jeunesPEAvecToken: 0,
      nombreJeunesTraites: 0,
      nombreNotificationsEnvoyees: 0,
      nombreNotificationsDoublons: 0,
      erreurs: 0
    }

    try {
      let offset = 0
      let jeunesPoleEmploi: Jeune.PoleEmploi[] = []

      do {
        jeunesPoleEmploi = await this.jeunePoleEmploiRepository.findAll(
          offset,
          NOMBRE_JEUNES_EN_PARALLELE
        )
        stats.jeunesPEAvecToken += jeunesPoleEmploi.length
        offset += NOMBRE_JEUNES_EN_PARALLELE

        try {
          const notifications =
            await this.poleEmploiClient.getNotificationsRendezVous(
              jeunesPoleEmploi.map(jeune => jeune.idAuthentification),
              hier,
              aujourdhui
            )

          for (const notificationsParJeune of notifications) {
            const jeuneANotifier = jeunesPoleEmploi.find(
              jeune =>
                jeune.idAuthentification === notificationsParJeune.idExterneDE
            )!

            const notificationsDeMoinsDeDeuxHeures: NotificationAEnvoyer[] =
              notificationsParJeune.notifications
                .filter(detailNotification =>
                  estUneNotificationDeMoinsDeDeuxHeures(
                    detailNotification.dateCreation,
                    maintenant
                  )
                )
                .map(enNotificationAEnvoyer)
                .sort(createdPuisUpdatedPuisDeleted)

            const notificationsAEnvoyer =
              notificationsDeMoinsDeDeuxHeures.reduce(
                garderUneNotificationParRendezVous,
                []
              )

            stats.nombreNotificationsDoublons +=
              notificationsDeMoinsDeDeuxHeures.length -
              notificationsAEnvoyer.length

            for (const notificationAEnvoyer of notificationsAEnvoyer) {
              this.notificationService.notifierUnRendezVousPoleEmploi(
                notificationAEnvoyer.typeMouvementRDV,
                jeuneANotifier.pushNotificationToken,
                notificationAEnvoyer.message,
                jeuneANotifier.id,
                notificationAEnvoyer.idMetier
              )
              stats.nombreNotificationsEnvoyees++
            }

            stats.nombreJeunesTraites++
          }
        } catch (e) {
          stats.erreurs++
          this.logger.error(e)
        }
      } while (jeunesPoleEmploi.length === NOMBRE_JEUNES_EN_PARALLELE)
      return {
        jobType: this.jobType,
        nbErreurs: stats.erreurs,
        succes: true,
        dateExecution: maintenant,
        tempsExecution: maintenant.diffNow().milliseconds * -1,
        resultat: stats
      }
    } catch (e) {
      this.logger.error("Le job de notifications des RDV PE s'est arrêté")
      return {
        jobType: this.jobType,
        nbErreurs: stats.erreurs,
        succes: false,
        dateExecution: maintenant,
        tempsExecution: maintenant.diffNow().milliseconds * -1,
        resultat: stats,
        erreur: e
      }
    }
  }
}

function estUneNotificationDeMoinsDeDeuxHeures(
  dateNotification: DateTime,
  maintenant: DateTime
): boolean {
  return (
    maintenant.diff(dateNotification).as('minute') <= 120 &&
    dateNotification < maintenant
  )
}

function enNotificationAEnvoyer(
  detailNotification: Notification.PoleEmploi.Notification
): NotificationAEnvoyer {
  return {
    idMetier: detailNotification.idMetier,
    message: detailNotification.message,
    typeMouvementRDV: detailNotification.typeMouvementRDV
  }
}

function supprimerLaNotification(
  notificationsPriorisees: NotificationAEnvoyer[],
  indexNotificationPrioriseeParRendezVous: number
): void {
  notificationsPriorisees.splice(indexNotificationPrioriseeParRendezVous, 1)
}

function garderUneNotificationParRendezVous(
  notificationsPriorisees: NotificationAEnvoyer[],
  notificationAPrioriser: NotificationAEnvoyer
): NotificationAEnvoyer[] {
  const indexNotificationPrioriseeParRendezVous =
    notificationsPriorisees.findIndex(
      n => n.idMetier === notificationAPrioriser.idMetier
    )

  const uneNotificationSurCeRendezVousEstPrevue =
    indexNotificationPrioriseeParRendezVous !== -1

  if (uneNotificationSurCeRendezVousEstPrevue) {
    if (notificationAPrioriser.typeMouvementRDV === Type.DELETED_RENDEZVOUS) {
      supprimerLaNotification(
        notificationsPriorisees,
        indexNotificationPrioriseeParRendezVous
      )
    } else if (
      notificationAPrioriser.typeMouvementRDV === Type.UPDATED_RENDEZVOUS
    ) {
      notificationsPriorisees[indexNotificationPrioriseeParRendezVous].message =
        notificationAPrioriser.message
    }
  } else {
    notificationsPriorisees.push(notificationAPrioriser)
  }

  return notificationsPriorisees
}

export interface Stats {
  jeunesPEAvecToken: number
  nombreJeunesTraites: number
  nombreNotificationsEnvoyees: number
  nombreNotificationsDoublons: number
  erreurs: number
}

interface NotificationAEnvoyer {
  typeMouvementRDV: Notification.TypeRdv
  message: string
  idMetier?: string
}

const ordreTypeRendezVous: { [type in Notification.TypeRdv]: number } = {
  NEW_RENDEZVOUS: 1,
  UPDATED_RENDEZVOUS: 2,
  DELETED_RENDEZVOUS: 3
}

function createdPuisUpdatedPuisDeleted(
  notificationAEnvoyer1: NotificationAEnvoyer,
  notificationAEnvoyer2: NotificationAEnvoyer
): number {
  return (
    ordreTypeRendezVous[notificationAEnvoyer1.typeMouvementRDV] -
    ordreTypeRendezVous[notificationAEnvoyer2.typeMouvementRDV]
  )
}
