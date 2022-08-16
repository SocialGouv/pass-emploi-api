import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import {
  emptySuccess,
  failure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Notification } from '../../../domain/notification/notification'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from '../../../domain/notification-support'

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
    notificationSupportService: NotificationSupport.Service
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

    const stats: Stats = {
      jeunesPEAvecToken: 0,
      nombreJeunesTraites: 0,
      nombreNotificationsEnvoyees: 0,
      erreurs: 0
    }

    try {
      let offset = 0
      let jeunesUtilisateursPE: UtilisateurJeunePE[] = []

      do {
        jeunesUtilisateursPE = await findJeunesPEAvecPushToken(
          offset,
          NOMBRE_JEUNES_EN_PARALLELE
        )
        stats.jeunesPEAvecToken += jeunesUtilisateursPE.length
        offset += NOMBRE_JEUNES_EN_PARALLELE

        const idsPE = jeunesUtilisateursPE.map(jeune => jeune.idPE)

        try {
          const notifications =
            await this.poleEmploiClient.getNotificationsRendezVous(
              idsPE,
              hier,
              aujourdhui
            )

          for (const notificationsParJeune of notifications) {
            const jeuneANotifier = jeunesUtilisateursPE.find(
              jeune => jeune.idPE === notificationsParJeune.idExterneDE
            )!

            for (const detailNotification of notificationsParJeune.notifications) {
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
                stats.nombreNotificationsEnvoyees++
              }
            }
            stats.nombreJeunesTraites++
          }
        } catch (e) {
          stats.erreurs++
          this.logger.error(e)
        }
      } while (jeunesUtilisateursPE.length === NOMBRE_JEUNES_EN_PARALLELE)
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

interface Stats {
  jeunesPEAvecToken: number
  nombreJeunesTraites: number
  nombreNotificationsEnvoyees: number
  erreurs: number
  tempsDExecution?: number
}

async function findJeunesPEAvecPushToken(
  offset: number,
  limit: number
): Promise<UtilisateurJeunePE[]> {
  const jeunesSqlModel = await JeuneSqlModel.findAll({
    where: {
      structure: Core.Structure.POLE_EMPLOI,
      pushNotificationToken: { [Op.ne]: null },
      idAuthentification: { [Op.ne]: null }
    },
    order: [['id', 'ASC']],
    offset,
    limit
  })

  return jeunesSqlModel.map(jeuneSql => {
    return {
      id: jeuneSql.id,
      idPE: jeuneSql.idAuthentification,
      pushNotificationToken: jeuneSql.pushNotificationToken!
    }
  })
}

interface UtilisateurJeunePE {
  id: string
  idPE: string
  pushNotificationToken: string
}
