import { Inject, Injectable } from '@nestjs/common'
import { emptySuccess, Result, success } from 'src/building-blocks/types/result'
import {
  ArchiveJeuneRepositoryToken,
  ArchiveJeune
} from 'src/domain/archive-jeune'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from 'src/domain/notification-support'
import { DateService } from 'src/utils/date-service'
import { buildError } from 'src/utils/logger.module'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'

@Injectable()
export class HandleJobNettoyerArchivesJeunesCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    @Inject(ArchiveJeuneRepositoryToken)
    private readonly archiveJeuneRepository: ArchiveJeune.Repository,
    private dateService: DateService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service
  ) {
    super(
      'HandleJobNettoyerArchivesJeunesCommandHandler',
      notificationSupportService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const stats: Stats = {
      archivesSupprimees: 0,
      erreurs: 0
    }
    const maintenant = this.dateService.now()

    const deuxAnsPlusTot: Date = this.dateService
      .now()
      .minus({ years: 2 })
      .toJSDate()

    const idsArchivesASupprimer =
      await this.archiveJeuneRepository.getIdsArchivesBefore(deuxAnsPlusTot)

    for (const id of idsArchivesASupprimer) {
      try {
        await this.archiveJeuneRepository.delete(id)
        stats.archivesSupprimees++
      } catch (e) {
        this.logger.error(
          buildError(`Erreur lors de la suppression de l'archive ${id}`, e)
        )
        stats.erreurs++
      }
    }

    stats.tempsDExecution = maintenant.diffNow().milliseconds * -1
    return success(stats)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  archivesSupprimees: number
  erreurs: number
  tempsDExecution?: number
}
