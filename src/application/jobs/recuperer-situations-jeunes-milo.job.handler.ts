import { Inject, Injectable } from '@nestjs/common'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { isFailure } from '../../building-blocks/types/result'
import { Jeune } from '../../domain/jeune/jeune'
import {
  JeuneMilo,
  JeuneMiloRepositoryToken
} from '../../domain/milo/jeune.milo'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'

const PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM = 100

@Injectable()
@ProcessJobType(Planificateur.JobType.RECUPERER_SITUATIONS_JEUNES_MILO)
export class RecupererSituationsJeunesMiloJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(JeuneMiloRepositoryToken)
    private miloRepository: JeuneMilo.Repository,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(
      Planificateur.JobType.RECUPERER_SITUATIONS_JEUNES_MILO,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    const stats = {
      jeunesMilo: 0,
      dossiersNonTrouves: 0,
      situationsJeuneSauvegardees: 0,
      erreurs: 0
    }
    const maintenant = this.dateService.now()
    const suivi: SuiviJob = {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: false,
      dateExecution: maintenant,
      tempsExecution: 0,
      resultat: {}
    }

    let offset = 0
    let jeunes: Jeune[] = []

    do {
      jeunes = await this.miloRepository.getJeunesMiloAvecIdDossier(
        offset,
        PAGINATION_NOMBRE_DE_JEUNES_MAXIMUM
      )

      const promises = await Promise.allSettled(
        jeunes.map(async jeune => {
          const dossier = await this.miloRepository.getDossier(
            jeune.idPartenaire!
          )

          if (isFailure(dossier)) {
            if ((dossier.error as ErreurHttp).statusCode === 404) {
              await this.miloRepository.marquerAARchiver(jeune.id, true)
            }

            stats.dossiersNonTrouves++
            return
          }

          const nouveauCodeStructureOuNull = dossier.data.codeStructure ?? null
          const nouvelleDateFinCEJOuNull = dossier.data.dateFinCEJ ?? null

          await this.miloRepository.save(
            jeune,
            nouveauCodeStructureOuNull,
            nouvelleDateFinCEJOuNull
          )

          const situationsTriees = JeuneMilo.trierSituations(
            dossier.data.situations
          )
          const situationsDuJeune: JeuneMilo.Situations = {
            idJeune: jeune.id,
            situationCourante:
              JeuneMilo.trouverSituationCourante(situationsTriees),
            situations: situationsTriees
          }

          await this.miloRepository.marquerAARchiver(jeune.id, false)
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

    return {
      ...suivi,
      nbErreurs: stats.erreurs,
      succes: true,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }
}
