import { Inject, Injectable } from '@nestjs/common'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Milo, MiloRepositoryToken } from 'src/domain/milo'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'

@Injectable()
export class HandleJobRecupererSituationsJeunesMiloCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    @Inject(MiloRepositoryToken) private miloRepository: Milo.Repository,
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    private dateService: DateService
  ) {
    super('HandleJobRecupererSituationsJeunesMiloCommandHandler')
  }

  async handle(): Promise<Result<Stats>> {
    const stats: Stats = {
      jeunesMilo: 0,
      dossiersNonTrouves: 0
    }
    const maintenant = this.dateService.now()

    const jeunes = await this.jeuneRepository.getAllMilo()

    for (const jeune of jeunes) {
      const dossier = await this.miloRepository.getDossier(jeune.idDossier!)

      if (isFailure(dossier)) {
        stats.dossiersNonTrouves++
        continue
      }

      const situationsTriees = Milo.trierSituations(dossier.data.situations)
      const situationsDuJeune: Milo.SituationsDuJeune = {
        idJeune: jeune.id,
        situationCourante: Milo.trouverSituationCourante(situationsTriees),
        situations: situationsTriees
      }

      await this.miloRepository.saveSituationsJeune(situationsDuJeune)
    }

    stats.jeunesMilo = jeunes.length
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
  jeunesMilo: number
  dossiersNonTrouves: number
  tempsDExecution?: number
}
