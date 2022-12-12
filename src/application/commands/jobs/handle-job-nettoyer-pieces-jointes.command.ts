import { Inject, Injectable } from '@nestjs/common'
import {
  emptySuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Fichier, FichierRepositoryToken } from '../../../domain/fichier'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { buildError } from '../../../utils/logger.module'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'

@Injectable()
export class HandleJobNettoyerPiecesJointesCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super('HandleJobNettoyerPiecesJointesCommandHandler', suiviJobService)
  }

  async handle(): Promise<Result<Stats>> {
    const stats: Stats = {
      fichiersSupprimes: 0,
      erreurs: 0
    }
    const maintenant = this.dateService.now()

    const quatreMoisPlusTot: Date = this.dateService
      .now()
      .minus({ months: 4 })
      .toJSDate()
    const idsFichiersASupprimer =
      await this.fichierRepository.getIdsFichiersBefore(quatreMoisPlusTot)

    for (const id of idsFichiersASupprimer) {
      try {
        await this.fichierRepository.softDelete(id)
        stats.fichiersSupprimes++
      } catch (e) {
        this.logger.error(
          buildError(`Erreur lors de la suppression du fichier ${id}`, e)
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
  fichiersSupprimes: number
  erreurs: number
  tempsDExecution?: number
}
