import { Inject, Injectable } from '@nestjs/common'
import { Result, success } from 'src/building-blocks/types/result'
import { Fichier, FichierRepositoryToken } from 'src/domain/fichier'
import { DateService } from 'src/utils/date-service'
import { buildError } from 'src/utils/logger.module'
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
    private dateService: DateService
  ) {
    super('HandleJobNettoyerPiecesJointesCommandHandler')
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

    await Promise.all(
      idsFichiersASupprimer.map(async id => {
        try {
          await this.fichierRepository.softDelete(id)
          stats.fichiersSupprimes++
        } catch (e) {
          this.logger.error(
            buildError(`Erreur lors de la suppression du fichier ${id}`, e)
          )
          stats.erreurs++
        }
      })
    )

    stats.tempsDExecution = maintenant.diffNow().milliseconds * -1
    return success(stats)
  }

  async authorize(): Promise<void> {
    return
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
