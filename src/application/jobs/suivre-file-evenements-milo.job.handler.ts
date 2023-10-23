import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { JobHandler } from '../../building-blocks/types/job-handler'
import {
  EvenementMilo,
  EvenementMiloRepositoryToken
} from '../../domain/milo/evenement.milo'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService,
  ProcessJobType
} from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO)
export class SuivreEvenementsMiloCronJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(EvenementMiloRepositoryToken)
    private evenementMiloRepository: EvenementMilo.Repository,
    private dateService: DateService,
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const debutDuJob = this.dateService.now()
    try {
      const jobEstEnCours = await this.planificateurRepository.estEnCours(
        this.jobType
      )

      if (jobEstEnCours) {
        return {
          jobType: this.jobType,
          dateExecution: debutDuJob,
          succes: true,
          resultat: {},
          nbErreurs: 0,
          tempsExecution: DateService.calculerTempsExecution(debutDuJob)
        }
      }
      let evenementsMilo: EvenementMilo[] = []
      let nombreEvenementsTraites = 0
      do {
        evenementsMilo = await this.evenementMiloRepository.findAllEvenements()

        for (const evenement of evenementsMilo) {
          await this.planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant(
            evenement
          )
          await this.evenementMiloRepository.acquitterEvenement(evenement)
        }
        nombreEvenementsTraites += evenementsMilo.length
      } while (evenementsMilo.length > 0)

      return {
        jobType: this.jobType,
        dateExecution: debutDuJob,
        succes: true,
        resultat: { nombreEvenementsTraites },
        nbErreurs: 0,
        tempsExecution: DateService.calculerTempsExecution(debutDuJob)
      }
    } catch (e) {
      this.logger.error(e)
      return {
        jobType: this.jobType,
        dateExecution: debutDuJob,
        succes: false,
        resultat: {},
        nbErreurs: 1,
        tempsExecution: DateService.calculerTempsExecution(debutDuJob),
        erreur: e
      }
    }
  }
}
