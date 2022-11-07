import { Inject, Injectable } from '@nestjs/common'
import {
  emptySuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from '../../../domain/notification-support'
import { DateService } from '../../../utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Op, WhereOptions } from 'sequelize'
import { ArchiveJeuneSqlModel } from '../../../infrastructure/sequelize/models/archive-jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { DateTime } from 'luxon'

@Injectable()
export class HandleJobNettoyerLesDonneesCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    private dateService: DateService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service
  ) {
    super(
      'HandleJobNettoyerLesDonneesCommandHandler',
      notificationSupportService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const maintenant = this.dateService.now()

    const nombreArchivesSupprimees = await ArchiveJeuneSqlModel.destroy({
      where: dateArchivageSuperieureADeuxAns(maintenant)
    })

    const nombreLogsApiSupprimees = await LogApiPartenaireSqlModel.destroy({
      where: dateSuperieureAUnMois(maintenant)
    })

    return success({
      tempsDExecution: maintenant.diffNow().milliseconds * -1,
      nombreArchivesSupprimees,
      nombreLogsApiSupprimees
    })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  nombreArchivesSupprimees: number
  nombreLogsApiSupprimees: number
  tempsDExecution?: number
}

function dateArchivageSuperieureADeuxAns(maintenant: DateTime): WhereOptions {
  return {
    dateArchivage: { [Op.lt]: maintenant.minus({ years: 2 }).toJSDate() }
  }
}

function dateSuperieureAUnMois(maintenant: DateTime): WhereOptions {
  return {
    date: { [Op.lt]: maintenant.minus({ month: 1 }).toJSDate() }
  }
}
