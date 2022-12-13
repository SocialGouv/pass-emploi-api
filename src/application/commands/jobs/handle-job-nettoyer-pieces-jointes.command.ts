import { Inject, Injectable } from '@nestjs/common'
import { Job } from '../../../building-blocks/types/job'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Fichier, FichierRepositoryToken } from '../../../domain/fichier'
import { Planificateur } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { buildError } from '../../../utils/logger.module'

@Injectable()
export class HandleJobNettoyerPiecesJointesCommandHandler extends JobHandler<Job> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.NETTOYER_LES_PIECES_JOINTES, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let fichiersSupprimes = 0
    let nbErreurs = 0
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
        fichiersSupprimes++
      } catch (e) {
        this.logger.error(
          buildError(`Erreur lors de la suppression du fichier ${id}`, e)
        )
        nbErreurs++
      }
    }

    return {
      jobType: this.jobType,
      nbErreurs,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.caculerTempsExecution(maintenant),
      resultat: { fichiersSupprimes }
    }
  }
}
