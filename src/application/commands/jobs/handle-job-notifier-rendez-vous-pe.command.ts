import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  emptySuccess,
  failure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Notification } from '../../../domain/notification/notification'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from '../../../domain/notification-support'
import {
  Jeune,
  JeunePoleEmploiRepositoryToken
} from '../../../domain/jeune/jeune'

const NOMBRE_JEUNES_EN_PARALLELE = 20

@Injectable()
export class HandleJobNotifierRendezVousPECommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private notificationService: Notification.Service,
    private dateService: DateService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service,
    @Inject(JeunePoleEmploiRepositoryToken)
    private jeunePoleEmploiRepository: Jeune.PoleEmploi.Repository
  ) {
    super(
      'HandleJobNotifierRendezVousPECommandHandler',
      notificationSupportService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const maintenant = this.dateService.now()
    const aujourdhui = maintenant.toISODate()
    const hier = maintenant.minus({ days: 1 }).toISODate()

    let stats: Stats = {
      jeunesPEAvecToken: 0,
      nombreJeunesTraites: 0,
      nombreNotificationsEnvoyees: 0,
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

            for (const detailNotification of notificationsParJeune.notifications) {
              stats = await this.envoyerLesNotificationsDesDeuxDernieresHeures(
                detailNotification,
                maintenant,
                jeuneANotifier,
                stats
              )
            }
            stats.nombreJeunesTraites++
          }
        } catch (e) {
          stats.erreurs++
          this.logger.error(e)
        }
      } while (jeunesPoleEmploi.length === NOMBRE_JEUNES_EN_PARALLELE)
      stats.tempsDExecution = maintenant.diffNow().milliseconds * -1
      return success(stats)
    } catch (e) {
      this.logger.error("Le job de notifications des RDV PE s'est arrêté")
      this.logger.log(stats)
      return failure(e)
    }
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  private async envoyerLesNotificationsDesDeuxDernieresHeures(
    detailNotification: Notification.PoleEmploi.Notification,
    maintenant: DateTime,
    jeuneANotifier: Jeune.PoleEmploi,
    stats: Stats
  ): Promise<Stats> {
    if (
      estUneNotificationDeMoinsDeDeuxHeures(
        detailNotification.dateCreation,
        maintenant
      )
    ) {
      await this.notificationService.notifierUnRendezVousPoleEmploi(
        detailNotification.typeMouvementRDV,
        jeuneANotifier.pushNotificationToken,
        detailNotification.message,
        detailNotification.idMetier
      )
      return {
        ...stats,
        nombreNotificationsEnvoyees: stats.nombreNotificationsEnvoyees + 1
      }
    }
    return { ...stats }
  }
}

function estUneNotificationDeMoinsDeDeuxHeures(
  dateNotification: DateTime,
  maintenant: DateTime
): boolean {
  const deuxHeuresPlusTot = maintenant.minus({ hour: 2 })
  return (
    dateNotification.startOf('hour') <= maintenant.startOf('hour') &&
    dateNotification.startOf('hour') >= deuxHeuresPlusTot.startOf('hour')
  )
}

export interface Stats {
  jeunesPEAvecToken: number
  nombreJeunesTraites: number
  nombreNotificationsEnvoyees: number
  erreurs: number
  tempsDExecution?: number
}
