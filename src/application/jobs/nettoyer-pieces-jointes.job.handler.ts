import { Inject, Injectable } from '@nestjs/common'
import { Chat, ChatRepositoryToken } from 'src/domain/chat'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'
import { buildError } from '../../utils/logger.module'

@Injectable()
@ProcessJobType(Planificateur.JobType.NETTOYER_LES_PIECES_JOINTES)
export class NettoyerPiecesJointesJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository
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
    const fichiersASupprimer = await this.fichierRepository.getFichiersBefore(
      quatreMoisPlusTot
    )

    for (const { id, idCreateur, idMessage } of fichiersASupprimer) {
      try {
        await this.fichierRepository.softDelete(id)
        await this.chatRepository.envoyerStatutAnalysePJ(
          idCreateur,
          idMessage!,
          Chat.StatutPJ.FICHIER_EXPIRE
        )

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
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: { fichiersSupprimes }
    }
  }
}
