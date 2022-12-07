import { Inject, Injectable } from '@nestjs/common'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Jeune, JeunesRepositoryToken } from '../../../domain/jeune/jeune'
import { Milo, MiloRepositoryToken } from '../../../domain/milo'
import { DateService } from '../../../utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { SuiviJobs, SuiviJobsServiceToken } from '../../../domain/suivi-jobs'

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 100

@Injectable()
export class HandleJobRecupererSituationsJeunesMiloCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    @Inject(MiloRepositoryToken) private miloRepository: Milo.Repository,
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(SuiviJobsServiceToken)
    suiviJobsService: SuiviJobs.Service,
    private dateService: DateService
  ) {
    super(
      'HandleJobRecupererSituationsJeunesMiloCommandHandler',
      suiviJobsService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const stats: Stats = {
      jeunesMilo: 0,
      dossiersNonTrouves: 0,
      situationsJeuneSauvegardees: 0,
      erreurs: 0
    }
    const maintenant = this.dateService.now()

    let offset = 0
    let jeunes: Jeune[] = []

    do {
      jeunes = await this.jeuneRepository.getJeunesMiloAvecIdDossier(
        offset,
        PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
      )

      const promises = await Promise.allSettled(
        jeunes.map(async jeune => {
          const dossier = await this.miloRepository.getDossier(
            jeune.idPartenaire!
          )

          if (isFailure(dossier)) {
            stats.dossiersNonTrouves++
            return
          }

          const dateFinCEJ = dossier.data.dateFinCEJ
          const jeuneAvecDateFinCEJ = Jeune.mettreAJour(jeune, { dateFinCEJ })
          await this.jeuneRepository.save(jeuneAvecDateFinCEJ)

          const situationsTriees = Milo.trierSituations(dossier.data.situations)
          const situationsDuJeune: Milo.SituationsDuJeune = {
            idJeune: jeune.id,
            situationCourante: Milo.trouverSituationCourante(situationsTriees),
            situations: situationsTriees
          }

          await this.miloRepository.saveSituationsJeune(situationsDuJeune)
          stats.situationsJeuneSauvegardees++
        })
      )

      promises.forEach(promise => {
        if (promise.status === 'rejected') {
          stats.erreurs++
          this.logger.error(promise.reason)
        }
      })
      stats.jeunesMilo += jeunes.length
      offset += PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
    } while (jeunes.length)

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
  jeunesMilo: number
  situationsJeuneSauvegardees: number
  dossiersNonTrouves: number
  erreurs: number
  tempsDExecution?: number
}
