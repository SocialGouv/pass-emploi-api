import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { PartenaireMiloRepositoryToken } from '../../../domain/partenaire/milo'
import { Partenaire } from '../../../domain/partenaire/partenaire'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class HandleJobSuivreEvenementsMiloHandler extends JobHandler<Job> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(PartenaireMiloRepositoryToken)
    private partenaireMiloRepository: Partenaire.Milo.Repository,
    private dateService: DateService,
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super(Planificateur.JobType.SUIVRE_EVENEMENTS_MILO, suiviJobService)
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
      let evenementsMilo: Partenaire.Milo.Evenement[] = []
      let nombreEvenementsTraites = 0
      do {
        evenementsMilo = await this.partenaireMiloRepository.findAllEvenements()

        for (const evenement of evenementsMilo) {
          await this.planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant(
            evenement
          )
          await this.partenaireMiloRepository.acquitterEvenement(evenement)
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
        tempsExecution: DateService.calculerTempsExecution(debutDuJob)
      }
    }
  }
}
